/** GitHub Releases transport and runner for Desktop update publication. */

import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DesktopGithubUploadPlan, DesktopUploadArtifact } from './desktop-upload-plan.ts'
import {
  desktopArtifactDigest,
  publishDesktopRelease,
  type DesktopObjectDigest,
  type DesktopPublishTransport,
  type DesktopRemoteObject,
} from './desktop-publish.ts'
import { recordPackagingEvent } from './packaging-run.mjs'

interface GithubAsset {
  readonly id: number
  readonly name: string
  readonly url: string
}

interface GithubRelease {
  readonly id: number
  readonly upload_url: string
}

/** Client settings for the GitHub REST API; tests supply a loopback apiBase. */
export interface DesktopGithubClientOptions {
  readonly token: string
  readonly apiBase?: string
  readonly fetchImpl?: typeof fetch
}

/** One API response that did not succeed. */
export class DesktopGithubApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'DesktopGithubApiError'
  }
}

const USER_AGENT = 'vega-harness-desktop-upload'

function client(options: DesktopGithubClientOptions) {
  const apiBase = (options.apiBase ?? 'https://api.github.com').replace(/\/+$/u, '')
  const fetchImpl = options.fetchImpl ?? fetch
  const request = async (method: string, url: string, init: { headers?: Record<string, string>; body?: BodyInit } = {}) => {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${options.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': USER_AGENT,
        ...init.headers,
      },
      body: init.body ?? null,
    })
    if (!response.ok) {
      throw new DesktopGithubApiError(response.status, `github api: ${method} ${url} returned ${response.status}`)
    }
    return response
  }
  const json = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const response = await request(method, `${apiBase}${path}`, body === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    return (text === '' ? undefined : JSON.parse(text)) as T
  }
  return { request, json }
}

function releaseUploadUrl(release: GithubRelease): string {
  return release.upload_url.replace(/\{\?[^}]*\}$/u, '')
}

/**
 * Find the release for the plan's version tag, creating a draft when absent.
 * Draft releases stay invisible to the updater until every asset verifies.
 * @param plan Validated GitHub upload plan; the release tag is `v{version}`.
 * @param options API credentials and endpoints.
 * @returns Release identity and its asset upload endpoint.
 */
export async function resolveGithubRelease(
  plan: DesktopGithubUploadPlan,
  options: DesktopGithubClientOptions,
): Promise<{ id: number; uploadUrl: string }> {
  const api = client(options)
  const repository = `/repos/${plan.owner}/${plan.repo}`
  const tag = `v${plan.version}`
  try {
    const existing = await api.json<GithubRelease>('GET', `${repository}/releases/tags/${tag}`)
    return { id: existing.id, uploadUrl: releaseUploadUrl(existing) }
  }
  catch (error) {
    if (!(error instanceof DesktopGithubApiError && error.status === 404)) throw error
  }
  const created = await api.json<GithubRelease>('POST', `${repository}/releases`, {
    tag_name: tag,
    name: `VEGA Harness ${plan.version}`,
    draft: true,
    prerelease: plan.channel === 'nightly',
    ...plan.commit === undefined ? {} : { target_commitish: plan.commit },
  })
  return { id: created.id, uploadUrl: releaseUploadUrl(created) }
}

/** Publish the draft release once every binary and feed verifies remotely. */
export async function publishGithubRelease(
  plan: DesktopGithubUploadPlan,
  releaseId: number,
  options: DesktopGithubClientOptions,
): Promise<void> {
  const api = client(options)
  await api.json('PATCH', `/repos/${plan.owner}/${plan.repo}/releases/${releaseId}`, {
    draft: false,
    make_latest: plan.channel === 'stable' ? 'legacy' : 'false',
  })
}

/**
 * Create a transport mapping plan artifact keys to release assets.
 * Binary assets are immutable; channel feeds and the fixed installer replace their asset.
 * @param plan Validated GitHub upload plan; keys outside it are rejected.
 * @param release Release from resolveGithubRelease.
 * @param options API credentials and endpoints.
 * @returns Reads through the asset API URL and writes one upload per artifact after local digest verification.
 */
export function desktopPublishGithub(
  plan: DesktopGithubUploadPlan,
  release: { id: number; uploadUrl: string },
  options: DesktopGithubClientOptions,
): DesktopPublishTransport {
  const keys = new Map(plan.artifacts.map(artifact => [artifact.key, artifact.channelMetadata]))
  const api = client(options)
  const repository = `/repos/${plan.owner}/${plan.repo}`
  const listAssets = async (): Promise<GithubAsset[]> => {
    const assets: GithubAsset[] = []
    for (let page = 1; ; page += 1) {
      const batch = await api.json<GithubAsset[]>('GET', `${repository}/releases/${release.id}/assets?per_page=100&page=${page}`)
      assets.push(...batch)
      if (batch.length < 100) return assets
    }
  }
  const location = (key: string, channel: boolean) => {
    if (keys.get(key) !== channel) throw new Error('desktop publish: asset is outside the selected plan')
  }
  return {
    async read(key, channel): Promise<DesktopRemoteObject | null> {
      location(key, channel)
      const asset = (await listAssets()).find(entry => entry.name === key)
      if (asset === undefined) return null
      const response = await api.request('GET', asset.url, {
        headers: { Accept: 'application/octet-stream' },
      })
      const bytes = Buffer.from(await response.arrayBuffer())
      if (channel && bytes.length > 1024 * 1024) throw new Error('desktop publish: channel metadata exceeds 1 MiB')
      return {
        size: bytes.length,
        sha512: createHash('sha512').update(bytes).digest('base64'),
        ...(channel ? { contents: bytes.toString('utf8') } : {}),
      }
    },
    async put(artifact: DesktopUploadArtifact, digest: DesktopObjectDigest, forbidOverwrite: boolean) {
      location(artifact.key, artifact.channelMetadata)
      const actual = await desktopArtifactDigest(artifact)
      if (actual.size !== digest.size || actual.sha512 !== digest.sha512) {
        throw new Error('desktop publish: local input changed')
      }
      const existing = (await listAssets()).find(entry => entry.name === artifact.key)
      if (existing !== undefined) {
        if (forbidOverwrite) throw new Error(`desktop publish: asset exists: ${artifact.key}`)
        await api.json('DELETE', `${repository}/releases/assets/${existing.id}`)
      }
      const parts: Buffer[] = []
      const source = artifact.contents === undefined ? createReadStream(artifact.path) : [Buffer.from(artifact.contents)]
      for await (const part of source) parts.push(Buffer.from(part))
      const body = Buffer.concat(parts)
      await api.request('POST', `${release.uploadUrl}?name=${encodeURIComponent(artifact.key)}`, {
        headers: { 'Content-Type': artifact.contentType, 'Content-Length': String(body.length) },
        body,
      })
    },
  }
}

/**
 * Publish the validated GitHub plan to its release, or attach the fixed installer asset alone.
 * @param plan Validated GitHub upload plan.
 * @param credentials Token used for this repository only.
 * @param recordsRoot Local retained evidence parent.
 * @param overrides API endpoint overrides; release automation supplies none.
 * @returns Fresh record directory after all writes succeed.
 */
export async function uploadDesktopGithubRelease(
  plan: DesktopGithubUploadPlan,
  credentials: { token: string },
  recordsRoot: string,
  overrides: Partial<DesktopGithubClientOptions> = {},
): Promise<string> {
  const options: DesktopGithubClientOptions = { token: credentials.token, ...overrides }
  await mkdir(recordsRoot, { recursive: true })
  const directory = await mkdtemp(join(recordsRoot, `${plan.environment}-${plan.target}-github-`))
  process.stdout.write(`desktop upload: record ${directory}\n`)
  const startedAt = new Date().toISOString()
  let stage = 'resolve-release'
  let success = false
  let failure: { errorCode: string } | undefined
  try {
    await writeFile(join(directory, 'events.jsonl'), '', { flag: 'wx', mode: 0o600, flush: true })
    recordPackagingEvent(directory, { type: 'upload-start', environment: plan.environment, target: plan.target, version: plan.version })
    const feeds = plan.artifacts.filter(artifact => artifact.channelMetadata)
    if (feeds.length === 0) {
      if (plan.artifacts.length !== 1) throw new Error('desktop upload: fixed installer uploads carry exactly one artifact')
      const artifact = plan.artifacts[0]!
      const release = await resolveGithubRelease(plan, options)
      stage = 'put'
      const transport = desktopPublishGithub(plan, release, options)
      const digest = await desktopArtifactDigest(artifact)
      recordPackagingEvent(directory, { type: 'put-intent', key: artifact.key, size: digest.size, sha512: digest.sha512 })
      const remote = await transport.read(artifact.key, false)
      if (remote !== null && remote.size === digest.size && remote.sha512 === digest.sha512) {
        recordPackagingEvent(directory, { type: 'object-present', key: artifact.key })
      }
      else {
        await transport.put(artifact, digest, false)
        const actual = await transport.read(artifact.key, false)
        if (actual === null || actual.size !== digest.size || actual.sha512 !== digest.sha512) {
          throw new Error(`desktop upload: remote bytes differ: ${artifact.key}`)
        }
        recordPackagingEvent(directory, { type: 'put-verified', key: artifact.key })
      }
      stage = 'complete'
      recordPackagingEvent(directory, { type: 'upload-complete', confirmedPuts: 1 })
      success = true
      return directory
    }
    const release = await resolveGithubRelease(plan, options)
    await writeFile(join(directory, 'plan.json'), `${JSON.stringify({ schemaVersion: 1,
      environment: plan.environment, target: plan.target, version: plan.version,
      repository: `${plan.owner}/${plan.repo}`, releaseId: release.id, publicUrl: plan.publicUrl,
      artifacts: plan.artifacts.map(({ contents: _contents, ...artifact }) => artifact) }, null, 2)}\n`,
    { flag: 'wx', mode: 0o600, flush: true })
    stage = 'publish'
    const result = await publishDesktopRelease(plan, {
      transport: desktopPublishGithub(plan, release, options),
      record: async (event) => { recordPackagingEvent(directory, event) },
      tag: () => publishGithubRelease(plan, release.id, options),
    })
    if (result.status === 'published-tag-pending') {
      throw new Error('desktop upload: assets are uploaded but the draft release did not publish; re-run to finish')
    }
    if (plan.environment !== 'production') await publishGithubRelease(plan, release.id, options)
    stage = 'complete'
    success = true
    return directory
  }
  catch (error) {
    failure = { errorCode: error instanceof DesktopGithubApiError ? `HTTP_${error.status}` : 'UNCLASSIFIED' }
    throw error
  }
  finally {
    await writeFile(join(directory, 'result.json'), `${JSON.stringify({ schemaVersion: 1, startedAt,
      finishedAt: new Date().toISOString(), environment: plan.environment, target: plan.target, version: plan.version,
      success, stage, failure }, null, 2)}\n`, { flag: 'wx', mode: 0o600, flush: true })
  }
}

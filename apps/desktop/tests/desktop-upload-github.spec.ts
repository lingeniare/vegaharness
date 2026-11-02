import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { dump } from 'js-yaml'
import type { DesktopGithubUploadPlan } from '../scripts/desktop-upload-plan.ts'
import { desktopPublishGithub, resolveGithubRelease, uploadDesktopGithubRelease }
  from '../scripts/desktop-upload-github.ts'

interface MockAsset { id: number; name: string; bytes: Buffer }
interface MockRelease {
  id: number
  tag: string
  draft: boolean
  prerelease: boolean
  name: string
  commitish?: string
  assets: MockAsset[]
}

interface GithubLoopback {
  readonly base: string
  readonly releases: Map<number, MockRelease>
  readonly calls: string[]
  close(): Promise<void>
}

async function startGithubLoopback(): Promise<GithubLoopback> {
  const releases = new Map<number, MockRelease>()
  const calls: string[] = []
  let nextReleaseId = 41
  let nextAssetId = 700
  const server: Server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    calls.push(`${request.method} ${url.pathname}${url.search}`)
    const reply = (status: number, body?: unknown) => {
      response.writeHead(status, body === undefined ? {} : { 'Content-Type': 'application/json' })
      response.end(body === undefined ? undefined : JSON.stringify(body))
    }
    const releaseByTag = (tag: string) => [...releases.values()].find(release => release.tag === tag)
    const releaseById = (id: number) => releases.get(id)
    const assetById = (id: number) => [...releases.values()].flatMap(release => release.assets)
      .find(asset => asset.id === id)
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const releaseJson = (release: MockRelease) => ({
      id: release.id, tag_name: release.tag, draft: release.draft, prerelease: release.prerelease,
      name: release.name, upload_url: `${base}/uploads/${release.id}/assets{?name,label}`,
    })
    const assetJson = (asset: MockAsset) => ({
      id: asset.id, name: asset.name, url: `${base}/repos/lingeniare/vegaharness/releases/assets/${asset.id}`,
      browser_download_url: `${base}/download/${asset.name}`,
    })
    const tagMatch = /^\/repos\/lingeniare\/vegaharness\/releases\/tags\/(.+)$/u.exec(url.pathname)
    const assetsMatch = /^\/repos\/lingeniare\/vegaharness\/releases\/(\d+)\/assets$/u.exec(url.pathname)
    const releaseMatch = /^\/repos\/lingeniare\/vegaharness\/releases\/(\d+)$/u.exec(url.pathname)
    const assetMatch = /^\/repos\/lingeniare\/vegaharness\/releases\/assets\/(\d+)$/u.exec(url.pathname)
    const uploadMatch = /^\/uploads\/(\d+)\/assets$/u.exec(url.pathname)
    if (request.method === 'GET' && tagMatch !== null) {
      const release = releaseByTag(decodeURIComponent(tagMatch[1]!))
      return release === undefined ? reply(404, { message: 'Not Found' }) : reply(200, releaseJson(release))
    }
    if (request.method === 'POST' && url.pathname === '/repos/lingeniare/vegaharness/releases') {
      const chunks: Buffer[] = []
      request.on('data', chunk => chunks.push(chunk))
      request.on('end', () => {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
        const release: MockRelease = {
          id: nextReleaseId++, tag: String(body.tag_name), draft: body.draft === true,
          prerelease: body.prerelease === true, name: String(body.name),
          ...typeof body.target_commitish === 'string' ? { commitish: body.target_commitish } : {},
          assets: [],
        }
        releases.set(release.id, release)
        reply(201, releaseJson(release))
      })
      return
    }
    if (request.method === 'GET' && assetsMatch !== null) {
      const release = releaseById(Number(assetsMatch[1]))
      if (release === undefined) return reply(404, { message: 'Not Found' })
      return reply(200, release.assets.map(assetJson))
    }
    if (request.method === 'PATCH' && releaseMatch !== null) {
      const release = releaseById(Number(releaseMatch[1]))
      if (release === undefined) return reply(404, { message: 'Not Found' })
      const chunks: Buffer[] = []
      request.on('data', chunk => chunks.push(chunk))
      request.on('end', () => {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
        if (body.draft === false) release.draft = false
        reply(200, releaseJson(release))
      })
      return
    }
    if (request.method === 'GET' && assetMatch !== null) {
      const asset = assetById(Number(assetMatch[1]))
      if (asset === undefined) return reply(404, { message: 'Not Found' })
      response.writeHead(200, { 'Content-Type': 'application/octet-stream' })
      response.end(asset.bytes)
      return
    }
    if (request.method === 'DELETE' && assetMatch !== null) {
      for (const release of releases.values()) {
        const index = release.assets.findIndex(asset => asset.id === Number(assetMatch[1]))
        if (index >= 0) { release.assets.splice(index, 1); return reply(204) }
      }
      return reply(404, { message: 'Not Found' })
    }
    if (request.method === 'POST' && uploadMatch !== null) {
      const release = releaseById(Number(uploadMatch[1]))
      if (release === undefined) return reply(404, { message: 'Not Found' })
      const chunks: Buffer[] = []
      request.on('data', chunk => chunks.push(chunk))
      request.on('end', () => {
        const asset: MockAsset = { id: nextAssetId++, name: url.searchParams.get('name') ?? '', bytes: Buffer.concat(chunks) }
        release.assets.push(asset)
        reply(201, assetJson(asset))
      })
      return
    }
    reply(404, { message: `unhandled ${request.method} ${url.pathname}` })
  })
  await new Promise<void>(resolveListening => server.listen(0, '127.0.0.1', resolveListening))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  return {
    base, releases, calls,
    close: () => new Promise<void>((resolveClose, rejectClose) => server.close(error => error ? rejectClose(error) : resolveClose())),
  }
}

const directories: string[] = []
const loopbacks: GithubLoopback[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })))
  await Promise.all(loopbacks.splice(0).map(loopback => loopback.close()))
})

async function artifactDir(files: Record<string, string>): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-github-upload-'))
  directories.push(directory)
  for (const [name, contents] of Object.entries(files)) await writeFile(join(directory, name), contents)
  return directory
}

function plan(directory: string, feedName: string, extra: Partial<DesktopGithubUploadPlan> = {}): DesktopGithubUploadPlan {
  return {
    provider: 'github', environment: 'test', channel: 'nightly', target: 'win-x64', version: '1.2.3',
    publicUrl: 'https://github.com/lingeniare/vegaharness/releases',
    owner: 'lingeniare', repo: 'vegaharness', tokenEnvName: 'DESKTOP_GITHUB_TOKEN',
    artifacts: [
      { path: join(directory, 'vega-harness-1.2.3-win-x64.exe'), filename: 'vega-harness-1.2.3-win-x64.exe',
        key: 'vega-harness-1.2.3-win-x64.exe', contentType: 'application/vnd.microsoft.portable-executable', channelMetadata: false },
      { path: join(directory, 'vega-harness-1.2.3-win-x64.exe.blockmap'), filename: 'vega-harness-1.2.3-win-x64.exe.blockmap',
        key: 'vega-harness-1.2.3-win-x64.exe.blockmap', contentType: 'application/octet-stream', channelMetadata: false },
      { path: join(directory, feedName), filename: feedName, key: feedName, contentType: 'application/yaml', channelMetadata: true,
        contents: dump({ version: '1.2.3', path: 'vega-harness-1.2.3-win-x64.exe',
          files: [{ url: 'vega-harness-1.2.3-win-x64.exe', sha512: createHash('sha512').update('installer-bytes').digest('base64'), size: 15 }] }) },
    ],
    ...extra,
  }
}

describe('github releases publication', () => {
  it('creates a draft release once and reuses it for reconciliation', async () => {
    const github = await startGithubLoopback()
    loopbacks.push(github)
    const directory = await artifactDir({})
    const options = { token: 'test-token', apiBase: github.base }
    const selected = plan(directory, 'nightly.yml')
    const first = await resolveGithubRelease(selected, options)
    const second = await resolveGithubRelease(selected, options)
    expect(second).toEqual(first)
    const release = github.releases.get(first.id)
    expect(release).toMatchObject({ tag: 'v1.2.3', draft: true, prerelease: true, name: 'VEGA Harness 1.2.3' })
    expect(github.calls.filter(call => call.startsWith('POST /repos'))).toHaveLength(1)
  })

  it('reads, replaces, and forbids overwrite on release assets', async () => {
    const github = await startGithubLoopback()
    loopbacks.push(github)
    const directory = await artifactDir({ 'vega-harness-1.2.3-win-x64.exe': 'installer-bytes' })
    const selected = plan(directory, 'nightly.yml')
    const options = { token: 'test-token', apiBase: github.base }
    const release = await resolveGithubRelease(selected, options)
    const transport = desktopPublishGithub(selected, release, options)
    expect(await transport.read('vega-harness-1.2.3-win-x64.exe', false)).toBeNull()
    const digest = { size: 15, sha512: createHash('sha512').update('installer-bytes').digest('base64') }
    await transport.put(selected.artifacts[0]!, digest, true)
    expect(await transport.read('vega-harness-1.2.3-win-x64.exe', false)).toMatchObject(digest)
    await expect(transport.put(selected.artifacts[0]!, digest, true)).rejects.toThrow(/asset exists/u)
    const feed = selected.artifacts.at(-1)!
    await transport.put(feed, { size: Buffer.byteLength(feed.contents!), sha512: createHash('sha512').update(feed.contents!).digest('base64') }, false)
    const remote = await transport.read('nightly.yml', true)
    expect(remote?.contents).toBe(feed.contents)
    await transport.put(feed, { size: Buffer.byteLength(feed.contents!), sha512: createHash('sha512').update(feed.contents!).digest('base64') }, false)
    expect(github.calls.some(call => call.startsWith('DELETE '))).toBe(true)
    expect(github.releases.get(release.id)!.assets.filter(asset => asset.name === 'nightly.yml')).toHaveLength(1)
  })

  it('publishes a draft only after every asset verifies', async () => {
    const github = await startGithubLoopback()
    loopbacks.push(github)
    const directory = await artifactDir({
      'vega-harness-1.2.3-win-x64.exe': 'installer-bytes',
      'vega-harness-1.2.3-win-x64.exe.blockmap': 'blockmap-bytes',
      'nightly.yml': 'unused',
    })
    const selected = plan(directory, 'nightly.yml')
    const records = join(directory, 'records')
    const record = await uploadDesktopGithubRelease(selected, { token: 'test-token' }, records, { apiBase: github.base })
    const release = [...github.releases.values()][0]!
    expect(release.draft).toBe(false)
    expect(release.assets.map(asset => asset.name).sort()).toEqual([
      'nightly.yml', 'vega-harness-1.2.3-win-x64.exe', 'vega-harness-1.2.3-win-x64.exe.blockmap'])
    expect(release.assets.find(asset => asset.name === 'nightly.yml')!.bytes.toString('utf8')).toBe(selected.artifacts.at(-1)!.contents)
    expect(github.calls.at(-1)).toMatch(/^PATCH \/repos/u)
    const result = JSON.parse(await readFile(join(record, 'result.json'), 'utf8')) as { success: boolean }
    expect(result.success).toBe(true)
  })

  it('keeps the release a draft when publication tagging fails', async () => {
    const github = await startGithubLoopback()
    loopbacks.push(github)
    const directory = await artifactDir({
      'vega-harness-1.2.3-win-x64.exe': 'installer-bytes',
      'vega-harness-1.2.3-win-x64.exe.blockmap': 'blockmap-bytes',
      'nightly.yml': 'unused',
    })
    const selected = plan(directory, 'nightly.yml', { environment: 'production', channel: 'latest',
      commit: 'f'.repeat(40), dirty: false })
    const records = join(directory, 'records')
    const failing = {
      apiBase: github.base,
      fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'PATCH') return new Response('broken', { status: 500 })
        return fetch(input, init)
      }) as typeof fetch,
    }
    await expect(uploadDesktopGithubRelease(selected, { token: 'test-token' }, records, failing))
      .rejects.toThrow(/did not publish/u)
    const release = [...github.releases.values()][0]!
    expect(release.draft).toBe(true)
    expect(release.assets).toHaveLength(3)
  })
})

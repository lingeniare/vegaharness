import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createMacOSAppUpdateConfig,
  resolveMacOSAppUpdateFeed,
  verifyMacOSAppUpdateConfig,
  writeMacOSAppUpdateConfig,
} from '../scripts/macos-app-update-config.mjs'

const roots: string[] = []
const update = { provider: 'generic' as const, publicUrl: 'https://desktop-updates.example.com/dsh-desk/feeds/mac-arm64/' }

async function fixture(): Promise<{ appPath: string; resourcesDir: string }> {
  const root = await mkdtemp(join(tmpdir(), 'desktop-macos-update-config-'))
  roots.push(root)
  const appPath = join(root, 'VEGA Harness.app')
  const resourcesDir = join(appPath, 'Contents', 'Resources')
  await mkdir(resourcesDir, { recursive: true })
  return { appPath, resourcesDir }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

describe('macOS packaged updater configuration', () => {
  it('uses the final generic Nightly provider configured for the build', () => {
    expect(resolveMacOSAppUpdateFeed([{ provider: 'generic', url: update.publicUrl, channel: 'nightly' }]))
      .toEqual({ ...update, channel: 'nightly' })
    for (const publish of [undefined, [], [{ provider: 'gitlab', channel: 'nightly', url: update.publicUrl }],
      [{ provider: 'github', channel: 'nightly' }], [{ provider: 'generic', channel: 'invalid', url: update.publicUrl }]]) {
      expect(() => resolveMacOSAppUpdateFeed(publish)).toThrow(/macOS update config/u)
    }
  })

  it('resolves a github feed from repository coordinates', () => {
    expect(resolveMacOSAppUpdateFeed([{
      provider: 'github', owner: 'lingeniare', repo: 'vegaharness', channel: 'nightly', vPrefixedTagName: true,
    }])).toEqual({ provider: 'github', owner: 'lingeniare', repo: 'vegaharness', channel: 'nightly' })
  })

  it('writes and verifies a github updater feed before signing', async () => {
    const paths = await fixture()
    const feed = { provider: 'github', owner: 'lingeniare', repo: 'vegaharness', channel: 'nightly' } as const
    expect(createMacOSAppUpdateConfig(feed, 'deepseek-harness-updater')).toEqual({
      provider: 'github',
      owner: 'lingeniare',
      repo: 'vegaharness',
      vPrefixedTagName: true,
      channel: 'nightly',
      updaterCacheDirName: 'deepseek-harness-updater',
    })
    await writeMacOSAppUpdateConfig(paths.resourcesDir, feed, 'deepseek-harness-updater')
    await expect(verifyMacOSAppUpdateConfig(paths.appPath, feed, 'deepseek-harness-updater')).resolves.toBeUndefined()
  })

  it('writes and verifies the fixed release feed before signing', async () => {
    const paths = await fixture()
    expect(createMacOSAppUpdateConfig(update, 'deepseek-harness-updater')).toEqual({
      provider: 'generic',
      url: update.publicUrl,
      channel: 'nightly',
      updaterCacheDirName: 'deepseek-harness-updater',
    })
    await writeMacOSAppUpdateConfig(paths.resourcesDir, update, 'deepseek-harness-updater')
    await expect(verifyMacOSAppUpdateConfig(paths.appPath, update, 'deepseek-harness-updater')).resolves.toBeUndefined()
  })

  it.each([
    ['missing', undefined],
    ['wrong feed', 'provider: generic\nurl: https://wrong.example.com/\nchannel: nightly\nupdaterCacheDirName: fixture\n'],
    ['missing cache directory', `provider: generic\nurl: ${update.publicUrl}\nchannel: nightly\n`],
  ] as const)('rejects %s updater configuration', async (_label, contents) => {
    const paths = await fixture()
    if (contents !== undefined) await writeFile(join(paths.resourcesDir, 'app-update.yml'), contents)
    await expect(verifyMacOSAppUpdateConfig(paths.appPath, update)).rejects.toThrow(/macOS update config/u)
  })

  it('rejects another updater cache directory when the signed value is known', async () => {
    const paths = await fixture()
    await writeMacOSAppUpdateConfig(paths.resourcesDir, update, 'wrong-updater')
    await expect(verifyMacOSAppUpdateConfig(paths.appPath, update, 'deepseek-harness-updater'))
      .rejects.toThrow(/expected deepseek-harness-updater/u)
  })
})


it('seals latest into the macOS updater file and rejects a different expected channel', async () => {
  const paths = await fixture()
  const latest = resolveMacOSAppUpdateFeed([{ provider: 'generic', url: update.publicUrl, channel: 'latest' }])
  await writeMacOSAppUpdateConfig(paths.resourcesDir, latest, 'fixture-updater')
  await expect(verifyMacOSAppUpdateConfig(paths.appPath, latest)).resolves.toBeUndefined()
  await expect(verifyMacOSAppUpdateConfig(paths.appPath, update)).rejects.toThrow(/does not match/u)
})

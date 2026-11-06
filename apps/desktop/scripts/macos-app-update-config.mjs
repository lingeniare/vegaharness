/** Write and verify the updater configuration sealed into a macOS application. */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { dump, load } from 'js-yaml'

const CONFIG_FILENAME = 'app-update.yml'
import { resolveDesktopUpdateChannel } from './desktop-auto-update-environment.mjs'

function object(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`desktop macOS update config: ${label} must be an object`)
  }
  return value
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`desktop macOS update config: ${label} must be a non-empty string`)
  }
  return value
}

/**
 * Resolve the one macOS feed from the final electron-builder configuration.
 * @param {unknown} publish - Final electron-builder publish setting.
 * @returns {{ provider: 'generic', publicUrl: string, channel?: 'nightly' | 'stable' } | { provider: 'github', owner: string, repo: string, channel?: 'nightly' | 'stable' }} Resolved feed used by the packaged App.
 */
export function resolveMacOSAppUpdateFeed(publish) {
  if (!Array.isArray(publish) || publish.length !== 1) {
    throw new Error('desktop macOS update config: publish must contain exactly one provider')
  }
  const provider = object(publish[0], 'publish provider')
  if (!['nightly', 'stable'].includes(provider.channel)) {
    throw new Error('desktop macOS update config: publish provider must declare the nightly or stable channel')
  }
  const channel = resolveDesktopUpdateChannel({ DSH_DESKTOP_UPDATE_CHANNEL: provider.channel })
  if (provider.provider === 'github') {
    return {
      provider: 'github',
      owner: nonEmptyString(provider.owner, 'publish provider owner'),
      repo: nonEmptyString(provider.repo, 'publish provider repo'),
      channel,
    }
  }
  if (provider.provider !== 'generic') {
    throw new Error('desktop macOS update config: publish provider must be generic or github')
  }
  return { provider: 'generic', publicUrl: nonEmptyString(provider.url, 'publish provider URL'), channel }
}

/**
 * Create the electron-updater configuration embedded before code signing.
 * @param {{ provider: 'generic', publicUrl: string, channel?: 'nightly' | 'stable' } | { provider: 'github', owner: string, repo: string, channel?: 'nightly' | 'stable' }} update - Resolved update feed.
 * @param {string} updaterCacheDirName - electron-builder application cache directory.
 * @returns {object} Packaged updater fields.
 */
export function createMacOSAppUpdateConfig(update, updaterCacheDirName) {
  const base = {
    channel: resolveDesktopUpdateChannel({ DSH_DESKTOP_UPDATE_CHANNEL: update.channel }),
    updaterCacheDirName: nonEmptyString(updaterCacheDirName, 'updater cache directory'),
  }
  if (update.provider === 'github') {
    return {
      provider: 'github',
      owner: nonEmptyString(update.owner, 'owner'),
      repo: nonEmptyString(update.repo, 'repo'),
      vPrefixedTagName: true,
      ...base,
    }
  }
  return {
    provider: 'generic',
    url: nonEmptyString(update.publicUrl, 'public URL'),
    ...base,
  }
}

/**
 * Write the updater configuration into an assembled App before signing.
 * @param {string} resourcesDir - App Contents/Resources directory.
 * @param {{ provider: 'generic', publicUrl: string, channel?: 'nightly' | 'stable' } | { provider: 'github', owner: string, repo: string, channel?: 'nightly' | 'stable' }} update - Resolved update feed.
 * @param {string} updaterCacheDirName - electron-builder application cache directory.
 * @returns {Promise<void>} Resolves after the configuration is durable.
 */
export async function writeMacOSAppUpdateConfig(resourcesDir, update, updaterCacheDirName) {
  const config = createMacOSAppUpdateConfig(update, updaterCacheDirName)
  await writeFile(join(resourcesDir, CONFIG_FILENAME), dump(config, { lineWidth: -1, noRefs: true }))
}

function expectedFeed(update) {
  if (update.provider === 'github') {
    return config => config.provider === 'github'
      && config.owner === update.owner
      && config.repo === update.repo
      && config.vPrefixedTagName === true
  }
  return config => config.provider === 'generic' && config.url === update.publicUrl
}

/**
 * Verify the updater configuration inside an assembled macOS App.
 * @param {string} appPath - Application bundle path.
 * @param {{ provider: 'generic', publicUrl: string, channel?: 'nightly' | 'stable' } | { provider: 'github', owner: string, repo: string, channel?: 'nightly' | 'stable' }} update - Expected update feed.
 * @param {string | undefined} updaterCacheDirName - Exact cache directory when known.
 * @returns {Promise<void>} Resolves when the packaged configuration matches the release destination.
 */
export async function verifyMacOSAppUpdateConfig(appPath, update, updaterCacheDirName = undefined) {
  const path = join(appPath, 'Contents', 'Resources', CONFIG_FILENAME)
  let parsed
  try {
    parsed = load(await readFile(path, 'utf8'))
  }
  catch (error) {
    throw new Error(`desktop macOS update config: cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`)
  }
  const config = object(parsed, CONFIG_FILENAME)
  const label = update.provider === 'github' ? `${update.owner}/${update.repo}` : update.publicUrl
  if (!expectedFeed(update)(config) || config.channel !== resolveDesktopUpdateChannel({ DSH_DESKTOP_UPDATE_CHANNEL: update.channel })) {
    throw new Error(`desktop macOS update config: ${path} does not match ${label}`)
  }
  const actualCacheDirName = nonEmptyString(config.updaterCacheDirName, `${CONFIG_FILENAME}.updaterCacheDirName`)
  if (updaterCacheDirName !== undefined && actualCacheDirName !== updaterCacheDirName) {
    throw new Error(`desktop macOS update config: ${path} has updater cache directory ${actualCacheDirName}; expected ${updaterCacheDirName}`)
  }
}

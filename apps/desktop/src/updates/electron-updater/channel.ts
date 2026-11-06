/** Update feed policy applied once at updater construction. */
import type { AppUpdater } from 'electron-updater'

/** The only supported Desktop distribution channel. */
export const DESKTOP_UPDATE_CHANNEL = 'stable'

/**
 * Select the operator-managed feed while preventing downgrades.
 * @param updater - Updater whose prior operations have settled.
 */
export function selectUpdateChannel(updater: AppUpdater): void {
  updater.channel = DESKTOP_UPDATE_CHANNEL
  // The library channel setter enables downgrades.
  updater.allowDowngrade = false
  updater.allowPrerelease = false
}

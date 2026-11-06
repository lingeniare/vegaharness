/** One-shot language seed the NSIS installer leaves beside the executable. */
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { resolveDesktopLocale, type DesktopLocale } from './locale.ts'

const installerLocaleFile = 'installer-locale'

/**
 * Read the language selected on the installer's welcome page while its seed is
 * still present. Only the canonical ids the installer writes are accepted.
 * @param directory - installation directory (`$INSTDIR`, the executable's folder).
 * @returns the seeded language, or undefined when the file is absent, unreadable, or foreign.
 */
export function readDesktopInstallerLocale(directory: string): DesktopLocale['id'] | undefined {
  try {
    const value = readFileSync(join(directory, installerLocaleFile), 'utf8').trim()
    const locale = resolveDesktopLocale(value)
    return locale.id === value ? locale.id : undefined
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('desktop installer locale: seed could not be read', error)
    }
    return undefined
  }
}

/**
 * Remove the installer language seed after adoption or when an explicit Host
 * preference superseded it; an absent file is not an error.
 * @param directory - installation directory (`$INSTDIR`, the executable's folder).
 */
export function clearDesktopInstallerLocale(directory: string): void {
  try {
    rmSync(join(directory, installerLocaleFile), { force: true })
  } catch (error) {
    console.warn('desktop installer locale: seed could not be removed', error)
  }
}

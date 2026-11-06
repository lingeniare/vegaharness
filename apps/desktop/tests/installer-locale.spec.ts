/** The NSIS installer seeds its language selection beside the executable for the first launch. */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it, onTestFinished } from 'vitest'
import { clearDesktopInstallerLocale, readDesktopInstallerLocale } from '../src/installer-locale.ts'

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'desktop-installer-locale-'))
  onTestFinished(() => { rmSync(directory, { recursive: true, force: true }) })
  return directory
}

it('reads the language the installer selector settled on', () => {
  const directory = fixture()
  expect(readDesktopInstallerLocale(directory)).toBeUndefined()
  writeFileSync(join(directory, 'installer-locale'), 'ru', { encoding: 'utf8' })
  expect(readDesktopInstallerLocale(directory)).toBe('ru')
})

it.each(['en', 'en\n'])('accepts the canonical id the installer writes: %j', (value) => {
  const directory = fixture()
  writeFileSync(join(directory, 'installer-locale'), value, { encoding: 'utf8' })
  expect(readDesktopInstallerLocale(directory)).toBe('en')
})

it.each(['de', 'russian', ''])('rejects content the installer never writes: %j', (value) => {
  const directory = fixture()
  writeFileSync(join(directory, 'installer-locale'), value, { encoding: 'utf8' })
  expect(readDesktopInstallerLocale(directory)).toBeUndefined()
})

it('drops the seed once the preference is adopted, tolerating a missing file', () => {
  const directory = fixture()
  expect(() => { clearDesktopInstallerLocale(directory) }).not.toThrow()
  writeFileSync(join(directory, 'installer-locale'), 'ru', { encoding: 'utf8' })
  clearDesktopInstallerLocale(directory)
  expect(existsSync(join(directory, 'installer-locale'))).toBe(false)
  expect(readDesktopInstallerLocale(directory)).toBeUndefined()
})

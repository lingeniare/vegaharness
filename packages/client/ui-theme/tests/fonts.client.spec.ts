/** The text and code fonts remain self-contained in the packaged Web application. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('offline text and code fonts', () => {
  it('ships a local WOFF2 per face with each redistribution license', () => {
    const css = readFileSync(new URL('../src/styles/fonts.css', import.meta.url), 'utf8')
    const faces = [...css.matchAll(/url\(\.\/([^)]*\.woff2)\)/g)].map(match => match[1])
    expect(faces.length).toBeGreaterThan(0)
    for (const face of faces) {
      const font = readFileSync(new URL(`../src/styles/${face}`, import.meta.url))
      expect(font.readUInt32BE(0)).toBe(0x774f4632)
    }
    expect(css).toContain("font-family: 'Google Sans'")
    expect(css).toContain("font-family: 'Google Sans Code'")
    expect(css).toContain('font-style: normal')
    expect(css).toContain('font-style: italic')
    expect(css).not.toMatch(/url\(https?:/)
    for (const license of ['GoogleSans-OFL.txt', 'GoogleSansCode-OFL.txt']) {
      expect(readFileSync(new URL(`../src/styles/${license}`, import.meta.url), 'utf8'))
        .toContain('SIL OPEN FONT LICENSE Version 1.1')
    }
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      files: string[]
      exports: Record<string, unknown>
    }
    expect(manifest.files).toContain('lib/styles')
    expect(manifest.exports['./fonts.css']).toBe('./lib/styles/fonts.css')
  })
})

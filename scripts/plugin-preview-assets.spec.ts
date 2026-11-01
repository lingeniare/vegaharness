/** Plugin feature previews are fixed-canvas SVGs beside their detail document: English required, Russian optional. */
import { globSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { JSDOM } from 'jsdom'
import { expect, it, onTestFinished } from 'vitest'

const root = `${import.meta.dirname}/..`
const svgPaths = globSync('packages/*/*/docs/*.svg', { cwd: root }).sort()
/** Size of one preview file, as the standalone bundle and Host routes serve the files individually. */
const MAX_BYTES = 1024 * 1024

it('keeps every preview a self-contained 640×300 SVG', () => {
  // Guard against a narrowed corpus: each preview moved into a bundle's docs directory stays checked.
  expect(svgPaths.length).toBeGreaterThan(0)
  const browser = new JSDOM('')
  onTestFinished(() => { browser.window.close() })
  const parser = new browser.window.DOMParser()
  const groups = new Map<string, { base?: string; ru?: string; other: string[] }>()
  for (const path of svgPaths) {
    const name = basename(path, '.svg')
    const stem = join(dirname(path), name.endsWith('.ru') ? name.slice(0, -3) : name)
    const group = groups.get(stem) ?? { other: [] }
    if (name.endsWith('.ru')) group.ru = path
    else if (name.includes('.')) group.other.push(path)
    else group.base = path
    groups.set(stem, group)
  }
  for (const [stem, group] of groups) {
    expect(group.base, stem).toBe(`${stem}.svg`)
    expect(group.other, stem).toEqual([])
  }
  for (const path of svgPaths) {
    const svg = readFileSync(join(root, path), 'utf8')
    expect(Buffer.byteLength(svg), path).toBeLessThanOrEqual(MAX_BYTES)
    const document = parser.parseFromString(svg, 'image/svg+xml')
    expect(document.querySelector('parsererror'), path).toBeNull()
    expect(document.documentElement.namespaceURI, path).toBe('http://www.w3.org/2000/svg')
    expect(document.documentElement.localName, path).toBe('svg')
    expect(document.documentElement.getAttribute('width'), path).toBe('640')
    expect(document.documentElement.getAttribute('height'), path).toBe('300')
    expect(document.documentElement.getAttribute('viewBox'), path).toBe('0 0 640 300')
    expect(document.querySelector('path, rect, circle, ellipse, line, polyline, polygon'), path).not.toBeNull()
    expect(document.querySelector('script, style, foreignObject, text, animate, animateTransform, animateMotion, set'), path).toBeNull()
    const ids = new Set([...document.querySelectorAll('[id]')].map(element => element.id))
    for (const element of [document.documentElement, ...document.querySelectorAll('*')]) {
      for (const attribute of element.attributes) {
        expect(attribute.name, path).not.toMatch(/^on/iu)
        const references = [...attribute.value.matchAll(/url\(([^)]+)\)/gu)].map(match => (match[1] ?? '').replace(/['"]/gu, '').trim())
        if (attribute.localName === 'href') references.push(attribute.value)
        for (const reference of references) {
          if (element.localName === 'image' && attribute.localName === 'href'
            && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z\d+/]+=*$/u.test(reference)) continue
          expect(reference.startsWith('#') && ids.has(reference.slice(1)), `${path}: ${reference}`).toBe(true)
        }
      }
    }
  }
})

import { describe, expect, it } from 'vitest'
import {
  extendArchiveManifest,
  parseArchiveManifest,
  renderArchiveManifest,
  validateArchiveArtifacts,
  validateArchiveManifestExtension,
  type ArchiveManifest,
} from './archived-agent-notes.ts'
import { isArchivedAgentNotePath } from './repo-files.ts'

function fixture(): Map<string, Buffer> {
  const base = '2026-07-26-example'
  const source = Buffer.from('# Agent Note: Example\n\nStatus: implemented\nArchived: 2026-07-26\n\n## Problem\n\nExample.\n')
  return new Map([[`process/${base}.md`, source]])
}

describe('archived Agent Notes', () => {
  it('recognizes archived paths with POSIX and Windows separators', () => {
    expect(isArchivedAgentNotePath('.agents/notes/archived/process/example.md')).toBe(true)
    expect(isArchivedAgentNotePath('.agents\\notes\\archived\\process\\example.md')).toBe(true)
    expect(isArchivedAgentNotePath('.agents/notes/implemented/process/example.md')).toBe(false)
  })

  it('accepts one complete implemented note with matching archive metadata', () => {
    expect(validateArchiveArtifacts(fixture())).toEqual([])
  })

  it.each(['# Agent Note：示例', '# Historical decision'])('preserves historical formatting: %s', (title) => {
    const artifacts = fixture()
    const base = '2026-07-26-example'
    artifacts.set(`process/${base}.md`, Buffer.from(`${title}\nStatus: implemented\nArchived: 2026-07-26\n`))
    expect(validateArchiveArtifacts(artifacts)).toEqual([])
  })

  it.each([
    ['Status: proposed\nArchived: 2026-07-26', /requires `Status: implemented`/],
    ['Status: implemented\n\nArchived: 2026-07-26', /immediately after the status/],
    ['Status: implemented\nArchived: 2026-02-30', /valid date/],
    ['Status: implemented\nArchived: 2026-07-25', /predates the note filename/],
  ])('rejects invalid archive metadata: %s', (metadata, error) => {
    const artifacts = fixture()
    artifacts.set('process/2026-07-26-example.md', Buffer.from(`# Historical decision\n${metadata}\n`))
    expect(validateArchiveArtifacts(artifacts).join('\n')).toMatch(error)
  })

  it('rejects unexpected artifact names and kinds', () => {
    const artifacts = fixture()
    artifacts.set('process/2026-07-26-example.i18n.yaml', Buffer.from('hashes: {}\n'))
    artifacts.set('other/2026-07-26-example.md', Buffer.from('# Note\nStatus: implemented\nArchived: 2026-07-26\n'))
    const problems = validateArchiveArtifacts(artifacts).join('\n')
    expect(problems).toMatch(/expected \{kind\}\/yyyy-mm-dd-topic\.md/)
    expect(problems).toMatch(/unknown Agent Note kind/)
  })

  it('extends the manifest without permitting a sealed change or removal', () => {
    const artifacts = fixture()
    const empty: ArchiveManifest = { version: 1, files: {} }
    const first = extendArchiveManifest(empty, artifacts)
    expect(first.errors).toEqual([])
    expect(first.added).toHaveLength(1)

    const sealed: ArchiveManifest = { version: 1, files: first.files }
    const changed = new Map(artifacts)
    changed.set('process/2026-07-26-example.md', Buffer.from('changed'))
    expect(extendArchiveManifest(sealed, changed).errors).toEqual([
      'process/2026-07-26-example.md: sealed content hash changed',
    ])
    changed.delete('process/2026-07-26-example.md')
    expect(extendArchiveManifest(sealed, changed).errors).toContain(
      'process/2026-07-26-example.md: sealed artifact is missing',
    )
  })

  it('permits retired .zh.md and .i18n.yaml seals to leave with their artifacts', () => {
    const base = '2026-07-26-example'
    const sealed: ArchiveManifest = {
      version: 1,
      files: {
        [`process/${base}.md`]: 'sha256:' + 'a'.repeat(64),
        [`process/${base}.zh.md`]: 'sha256:' + 'b'.repeat(64),
        [`process/${base}.i18n.yaml`]: 'sha256:' + 'c'.repeat(64),
      },
    }
    const artifacts = fixture()
    const extended = extendArchiveManifest(sealed, artifacts)
    expect(extended.errors).toEqual([
      `process/${base}.md: sealed content hash changed`,
    ])
    expect(Object.keys(extended.files)).not.toContain(`process/${base}.zh.md`)
    expect(Object.keys(extended.files)).not.toContain(`process/${base}.i18n.yaml`)

    const current: ArchiveManifest = { version: 1, files: { [`process/${base}.md`]: 'sha256:' + 'a'.repeat(64) } }
    expect(validateArchiveManifestExtension(sealed, current)).toEqual([])
  })

  it('rejects replacing manifest seals alongside changed archive content', () => {
    const artifacts = fixture()
    const initial = extendArchiveManifest({ version: 1, files: {} }, artifacts)
    const baseline: ArchiveManifest = { version: 1, files: initial.files }
    const path = 'process/2026-07-26-example.md'
    const changedArtifacts = new Map(artifacts)
    changedArtifacts.set(path, Buffer.from('changed'))
    const replacement = extendArchiveManifest({ version: 1, files: {} }, changedArtifacts)
    const current: ArchiveManifest = { version: 1, files: replacement.files }

    expect(extendArchiveManifest(current, changedArtifacts).errors).toEqual([])
    expect(validateArchiveManifestExtension(baseline, current)).toEqual([
      `${path}: sealed manifest hash changed`,
    ])
    const removed: ArchiveManifest = {
      version: 1,
      files: Object.fromEntries(Object.entries(current.files).filter(([candidate]) => candidate !== path)),
    }
    expect(validateArchiveManifestExtension(baseline, removed)).toContain(
      `${path}: sealed manifest entry is missing`,
    )
  })

  it('accepts only the authorized seal transition for the durable-workflow note', () => {
    const path = 'feature/2026-08-10-durable-workflow-runs-in-chat.md'
    const before = 'sha256:f9f5290cd880908d17b1080ae5776f22e182f5253471f90cf8bead418b33b502'
    const after = 'sha256:6018de4a89ca99d6cbfd618aff1c8136b23d8e4854a30f7b12a602f0417cbdc2'
    const manifest = (hash: string): ArchiveManifest => ({ version: 1, files: { [path]: hash } })
    expect(validateArchiveManifestExtension(manifest(before), manifest(after))).toEqual([])
    expect(validateArchiveManifestExtension(manifest(after), manifest(before))).toEqual([
      `${path}: sealed manifest hash changed`,
    ])
    expect(validateArchiveManifestExtension(manifest(before), manifest('sha256:' + '0'.repeat(64)))).toHaveLength(1)
    expect(validateArchiveManifestExtension(manifest('sha256:' + '0'.repeat(64)), manifest(after))).toHaveLength(1)
    expect(validateArchiveManifestExtension(manifest(before), { version: 1, files: {} })).toHaveLength(1)
    expect(validateArchiveManifestExtension(
      { version: 1, files: { 'process/other.md': before } },
      { version: 1, files: { 'process/other.md': after } },
    )).toHaveLength(1)
  })

  it('round-trips the deterministic manifest schema', () => {
    const content = renderArchiveManifest({ 'process/z.md': `sha256:${'a'.repeat(64)}` })
    expect(parseArchiveManifest(content)).toEqual({
      version: 1,
      files: { 'process/z.md': `sha256:${'a'.repeat(64)}` },
    })
  })
})

/**
 * Applies i18n/ru.json (the reviewed Russian export) back onto the source
 * dictionaries: for every namespace/key in ru.json it rewrites the string
 * literal registered for `ru` through ctx.locale.register(). Keys present in
 * the tree but absent from ru.json keep their current text (new upstream
 * keys); ru.json keys the tree lacks are dropped unless the `en` dictionary
 * still declares them, in which case they are appended to the ru dictionary.
 *
 * Understands the same shapes as extract-ru-locale.mjs plus computed
 * initializers: `'a' + 'b'` concatenations and `[...].join('x')` arrays are
 * rewritten with the exported flat text.
 *
 * Run from the repo root after upstream syncs:
 *
 *   node i18n/apply-ru-locale.mjs          # apply
 *   node i18n/apply-ru-locale.mjs --check  # report only, write nothing
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const ROOT = process.cwd()
const SKIP_DIR = new Set(['node_modules', 'lib', 'tests', '.git', 'dist', 'out'])
const CHECK_ONLY = process.argv.includes('--check')
const REF_PATH = path.join(ROOT, 'i18n', 'ru.json')

/** @returns {string[]} all parseable source files under dir */
function collectSources(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIR.has(entry.name)) collectSources(full, out)
    } else if (/\.(ts|tsx|mts|cts)$/.test(entry.name) && !entry.name.endsWith('.d.ts') && !entry.name.includes('.spec.')) {
      out.push(full)
    }
  }
  return out
}

const kindOf = file => (file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)

/** Per-file parse cache: sourceFile, local consts, exported consts, imports. */
const parsed = new Map()
function parseFile(file) {
  if (parsed.has(file)) return parsed.get(file)
  const text = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kindOf(file))
  const info = { sf, text, consts: new Map(), exported: new Map(), imports: new Map(), reexports: new Map() }
  const visit = node => {
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) continue
        info.consts.set(decl.name.text, decl.initializer)
        if (isExported) info.exported.set(decl.name.text, decl.initializer)
      }
    }
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.importClause) {
      const target = resolveModule(file, node.moduleSpecifier.text)
      const bind = (local, imported) => { if (local && imported && target) info.imports.set(local, { file: target, name: imported }) }
      const clause = node.importClause
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) bind(el.name.text, (el.propertyName ?? el.name).text)
      }
      if (clause.name) bind(clause.name.text, 'default')
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) &&
        node.exportClause && ts.isNamedExports(node.exportClause)) {
      const target = resolveModule(file, node.moduleSpecifier.text)
      if (target) for (const el of node.exportClause.elements) {
        info.reexports.set(el.name.text, { file: target, name: (el.propertyName ?? el.name).text })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  parsed.set(file, info)
  return info
}

function resolveModule(fromFile, spec) {
  if (!spec.startsWith('.')) return undefined
  const base = path.resolve(path.dirname(fromFile), spec)
  for (const cand of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand
  }
  return undefined
}

/** Resolve an identifier to its initializer, following same-package imports. */
function resolveIdent(name, file, seen = new Set()) {
  const key = `${file}#${name}`
  if (seen.has(key)) return undefined
  seen.add(key)
  const info = parseFile(file)
  if (info.consts.has(name)) return { expr: info.consts.get(name), file }
  const imp = info.imports.get(name) ?? info.reexports.get(name)
  if (imp) return resolveIdent(imp.name, imp.file, seen)
  return undefined
}

/** Unwrap satisfies/as/parenthesized/non-null wrappers. */
function unwrap(expr) {
  while (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr) ||
         ts.isParenthesizedExpression(expr) || ts.isNonNullExpression(expr)) {
    expr = expr.expression
  }
  return expr
}

function stringValue(expr, file, seen = new Set()) {
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text
  if (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr) ||
      ts.isParenthesizedExpression(expr) || ts.isNonNullExpression(expr)) {
    return stringValue(expr.expression, file, seen)
  }
  if (ts.isIdentifier(expr)) {
    const hit = resolveIdent(expr.text, file, seen)
    if (hit) return stringValue(hit.expr, hit.file, seen)
  }
  return undefined
}

/**
 * Flatten a dict object literal into ordered key → { value?, pa, file }.
 * `pa` is the property node that supplies the runtime value (last write
 * wins), `file` its source file; `value` is absent for computed
 * initializers ([...].join, 'a' + 'b', function calls).
 */
function flattenDict(obj, file, seen = new Set(), out = new Map()) {
  for (const el of obj.properties) {
    if (ts.isPropertyAssignment(el)) {
      const key = ts.isStringLiteral(el.name) || ts.isIdentifier(el.name) || ts.isNumericLiteral(el.name)
        ? el.name.text : undefined
      if (key === undefined) continue
      out.set(key, { pa: el, file, value: stringValue(el.initializer, file) })
    } else if (ts.isSpreadAssignment(el)) {
      const innerObj = objectFromExpr(el.expression, file, seen)
      if (innerObj) flattenDict(innerObj.expr, innerObj.file, seen, out)
    } else if (ts.isShorthandPropertyAssignment(el)) {
      const hit = resolveIdent(el.name.text, file)
      const value = hit && stringValue(hit.expr, hit.file)
      out.set(el.name.text, { pa: el, file, value })
    }
  }
  return out
}

/** Resolve a dict-valued expression to its object literal. */
function objectFromExpr(expr, file, seen = new Set()) {
  expr = unwrap(expr)
  if (ts.isObjectLiteralExpression(expr)) return { expr, file }
  if (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr)) {
    const name = ts.isIdentifier(expr) ? expr.text : expr.name.text
    const hit = resolveIdent(name, file, seen)
    if (!hit) return undefined
    const unwrapped = unwrap(hit.expr)
    if (seen.has(unwrapped)) return undefined
    seen.add(unwrapped)
    if (ts.isObjectLiteralExpression(unwrapped)) return { expr: unwrapped, file: hit.file }
  }
  return undefined
}

/** Per-locale dict expressions inside a register() call's dictionaries argument. */
function dictsArgEntries(arg, file) {
  const out = new Map() // locale -> dict expr
  const hit = objectFromExpr(arg, file)
  if (!hit) return out
  for (const el of hit.expr.properties) {
    if (ts.isPropertyAssignment(el)) {
      const name = ts.isStringLiteral(el.name) || ts.isIdentifier(el.name) ? el.name.text : undefined
      if (name !== undefined) out.set(name, { expr: el.initializer, file })
    } else if (ts.isShorthandPropertyAssignment(el)) {
      out.set(el.name.text, { expr: el.name, file })
    }
  }
  return out
}

/** for..of over literal [locale, dict] tuples (directory-picker style). */
function dictsFromForOf(call, file) {
  const out = new Map()
  let node = call.parent
  while (node && !ts.isForOfStatement(node)) node = node.parent
  if (!node || !ts.isIdentifier(node.expression)) return out
  const hit = resolveIdent(node.expression.text, file)
  if (!hit || !ts.isArrayLiteralExpression(unwrap(hit.expr))) return out
  for (const tuple of unwrap(hit.expr).elements) {
    if (ts.isArrayLiteralExpression(tuple) && tuple.elements.length === 2 && ts.isStringLiteral(tuple.elements[0])) {
      out.set(tuple.elements[0].text, { expr: tuple.elements[1], file })
    }
  }
  return out
}

/** Emit a single-quoted TS string literal for a dictionary value. */
function quote(value) {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    // eslint-disable-next-line no-control-regex
    .replace(/[ -]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
  return `'${escaped}'`
}

/** Line indentation of a node in its file text. */
function indentOf(node, info) {
  const lineStart = info.text.lastIndexOf('\n', node.getStart(info.sf) - 1) + 1
  const match = /^[ \t]*/.exec(info.text.slice(lineStart))
  return match ? match[0] : ''
}

/** Replacement text for a dictionary property initializer. */
function replacementFor(entry, value, problems) {
  const init = unwrap(entry.pa.initializer ?? entry.pa.name)
  // [...].join(sep): regenerate the array with the file's own separator.
  if (ts.isCallExpression(init) && ts.isPropertyAccessExpression(init.expression) &&
      init.expression.name.text === 'join' && init.arguments.length === 1 &&
      ts.isStringLiteral(init.arguments[0]) &&
      ts.isArrayLiteralExpression(unwrap(init.expression.expression))) {
    const info = parseFile(entry.file)
    const propIndent = indentOf(entry.pa, info)
    const elements = value.split(/\n{2,}/)
    const lines = elements.map(el => `${propIndent}  ${quote(el)}`)
    return `[\n${lines.join(',\n')},\n${propIndent}].join(${init.arguments[0].getText(info.sf)})`
  }
  return quote(value)
}

const ref = JSON.parse(fs.readFileSync(REF_PATH, 'utf8'))
const files = collectSources(path.join(ROOT, 'packages'))

// ns -> { ru: {entries, topLit, file}, enKeys: Set }
const namespaces = new Map()
const problems = []

function recordNs(ns, locale, dictExpr, dictFile) {
  const obj = objectFromExpr(dictExpr, dictFile)
  if (!obj) { problems.push(`unresolved ${locale} dict for "${ns}" in ${path.relative(ROOT, dictFile)}`); return }
  if (!namespaces.has(ns)) namespaces.set(ns, {})
  const entry = namespaces.get(ns)
  const entries = flattenDict(obj.expr, obj.file)
  if (locale === 'ru') entry.ru = { entries, topLit: obj.expr, file: obj.file }
  else if (locale === 'en') entry.enKeys = new Set(entries.keys())
}

for (const file of files) {
  const { sf } = parseFile(file)
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'register' &&
        node.expression.expression.getText(sf).endsWith('locale')) {
      const [nsArg, second, third] = node.arguments
      const ns = nsArg && stringValue(nsArg, file)
      if (ns === undefined) {
        problems.push(`unresolved namespace in ${path.relative(ROOT, file)}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1}`)
      } else if (third !== undefined) {
        // register(ns, 'ru', dict) — or the for-of tuple form.
        if (ts.isStringLiteral(second)) recordNs(ns, second.text, third, file)
        else for (const [locale, d] of dictsFromForOf(node, file)) recordNs(ns, locale, d.expr, d.file)
      } else if (second !== undefined) {
        for (const [locale, d] of dictsArgEntries(second, file)) recordNs(ns, locale, d.expr, d.file)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

// edits: file -> [{pos, end, text}]; conflicts: same node, differing targets.
const edits = new Map()
const editSeen = new Map() // `${file}:${pos}` -> text
const poisoned = new Set() // conflicting positions: neither target is applied
const conflicts = []
const droppedForkKeys = [] // in ru.json but absent from the tree's en dict
const inserts = []         // appended into a ru literal
const unresolvedInit = []  // replaced computed initializers
let updated = 0, identical = 0, inserted = 0

function scheduleEdit(file, pos, end, text, label) {
  const key = `${file}:${pos}`
  const prior = editSeen.get(key)
  if (prior !== undefined) {
    if (prior !== text) {
      poisoned.add(key)
      conflicts.push(`${label}: shared node already targeted in ${path.relative(ROOT, file)}`)
    }
    return
  }
  editSeen.set(key, text)
  if (!edits.has(file)) edits.set(file, [])
  edits.get(file).push({ pos, end, text, key })
}

for (const [ns, refDict] of Object.entries(ref)) {
  const nsInfo = namespaces.get(ns)
  if (!nsInfo?.ru) { problems.push(`namespace "${ns}" has no ru dictionary in the tree`); continue }
  for (const [key, value] of Object.entries(refDict)) {
    const entry = nsInfo.ru.entries.get(key)
    if (!entry) {
      if (nsInfo.enKeys?.has(key)) {
        // The en dictionary still declares the key; append it to the ru literal.
        const props = nsInfo.ru.topLit.properties
        const last = props[props.length - 1]
        const info = parseFile(nsInfo.ru.file)
        const propIndent = props.length ? indentOf(props[0], info) : '  '
        const hasTrailingComma = last !== undefined && info.text[last.getEnd()] === ','
        const pos = last === undefined ? nsInfo.ru.topLit.getStart() + 1 : last.getEnd() + (hasTrailingComma ? 1 : 0)
        const text = `${hasTrailingComma ? '' : ','}\n${propIndent}${quote(key)}: ${quote(value)},`
        scheduleEdit(nsInfo.ru.file, pos, pos, text, `${ns}.${key}`)
        inserts.push(`${ns}.${key}`)
        inserted++
      } else {
        droppedForkKeys.push(`${ns}.${key}`)
      }
      continue
    }
    if (entry.value === value) { identical++; continue }
    if (entry.value === undefined) unresolvedInit.push(`${ns}.${key}`)
    if (ts.isShorthandPropertyAssignment(entry.pa)) {
      scheduleEdit(entry.file, entry.pa.getStart(), entry.pa.getEnd(), `${quote(key)}: ${quote(value)}`, `${ns}.${key}`)
    } else {
      const init = entry.pa.initializer
      scheduleEdit(entry.file, init.getStart(), init.getEnd(), replacementFor(entry, value, problems), `${ns}.${key}`)
    }
    updated++
  }
}

let touched = 0
for (const [file, list] of edits) {
  const info = parseFile(file)
  const sorted = [...list].filter(e => !poisoned.has(e.key)).sort((a, b) => b.pos - a.pos)
  if (!sorted.length) continue
  let text = info.text
  for (const e of sorted) text = text.slice(0, e.pos) + e.text + text.slice(e.end)
  touched++
  if (!CHECK_ONLY) fs.writeFileSync(file, text)
}

console.log(`${CHECK_ONLY ? 'check' : 'applied'}: ${updated} values updated, ${inserted} keys inserted, ${identical} already matched`)
console.log(`files touched: ${touched}`)
if (conflicts.length) {
  console.log('\nconflicts (shared node, differing targets — left unchanged):')
  for (const c of conflicts) console.log(`  ${c}`)
}
if (unresolvedInit.length) {
  console.log(`\ncomputed initializers replaced with flat text: ${unresolvedInit.length}`)
  for (const u of unresolvedInit) console.log(`  ${u}`)
}
if (droppedForkKeys.length) {
  console.log(`\nru.json keys absent from the tree's en dictionaries (dropped): ${droppedForkKeys.length}`)
  for (const d of droppedForkKeys) console.log(`  ${d}`)
}
if (problems.length) {
  console.log('\nunresolved:')
  for (const p of problems) console.log(`  ${p}`)
}

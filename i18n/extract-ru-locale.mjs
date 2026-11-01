/**
 * Extracts every Russian dictionary registered through ctx.locale.register()
 * into i18n/ru.json ({ namespace: { key: text } }) plus i18n/ru.sources.json
 * ({ namespace: { package file, export name } }). Static TypeScript-AST pass:
 * resolves string-literal namespaces, imported dict bindings, and spread
 * composition inside dictionaries. Run from the repo root:
 *
 *   node i18n/extract-ru-locale.mjs
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const ROOT = process.cwd()
const SKIP_DIR = new Set(['node_modules', 'lib', 'tests', '.git', 'dist', 'out'])
const OUT_DIR = path.join(ROOT, 'i18n')

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
  const info = { sf, consts: new Map(), exported: new Map(), imports: new Map(), reexports: new Map() }
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

const consumed = new Set() // "file#exportName" entries pulled into a registered dict
const dynamicEntries = []

/** Flatten a dict object literal into ordered key → text, following spreads. */
function extractDict(obj, file, seen = new Set()) {
  const out = new Map()
  for (const el of obj.properties) {
    if (ts.isPropertyAssignment(el)) {
      const key = ts.isStringLiteral(el.name) || ts.isIdentifier(el.name) || ts.isNumericLiteral(el.name)
        ? el.name.text : undefined
      if (key === undefined) { dynamicEntries.push({ file, note: 'computed key' }); continue }
      const value = stringValue(el.initializer, file)
      if (value !== undefined) out.set(key, value)
      else dynamicEntries.push({ file, key, note: ts.SyntaxKind[el.initializer.kind] })
    } else if (ts.isSpreadAssignment(el)) {
      const inner = dictFromExpr(el.expression, file, seen)
      if (inner) for (const [k, v] of inner) out.set(k, v)
      else dynamicEntries.push({ file, note: `unresolved spread ${el.expression.getText(obj.getSourceFile())}` })
    } else if (ts.isShorthandPropertyAssignment(el)) {
      const hit = resolveIdent(el.name.text, file)
      const value = hit && stringValue(hit.expr, hit.file)
      if (value !== undefined) out.set(el.name.text, value)
      else dynamicEntries.push({ file, key: el.name.text, note: 'shorthand' })
    }
  }
  return out
}

/** Turn a dict-valued expression into its flat entries. */
function dictFromExpr(expr, file, seen) {
  if (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr) ||
      ts.isParenthesizedExpression(expr) || ts.isNonNullExpression(expr)) {
    return dictFromExpr(expr.expression, file, seen)
  }
  if (ts.isObjectLiteralExpression(expr)) return extractDict(expr, file, seen)
  if (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr)) {
    const name = ts.isIdentifier(expr) ? expr.text : expr.name.text
    const hit = resolveIdent(name, file, seen)
    if (!hit || seen.has(hit.expr)) return undefined
    seen.add(hit.expr)
    const hitInfo = parseFile(hit.file)
    for (const [exportName, init] of hitInfo.exported) if (init === hit.expr) consumed.add(`${hit.file}#${exportName}`)
    return dictFromExpr(hit.expr, hit.file, seen)
  }
  return undefined
}

/** Unwrap satisfies/as/parenthesized/non-null wrappers. */
function unwrapExpr(expr) {
  while (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr) ||
         ts.isParenthesizedExpression(expr) || ts.isNonNullExpression(expr)) {
    expr = expr.expression
  }
  return expr
}

/** Locate the `ru` dict expression inside a register() call's dictionary argument. */
function ruFromDictsArg(arg, file) {
  const obj = ts.isObjectLiteralExpression(arg) ? arg : (() => {
    if (ts.isIdentifier(arg)) {
      const hit = resolveIdent(arg.text, file)
      if (!hit) return undefined
      const expr = unwrapExpr(hit.expr)
      return ts.isObjectLiteralExpression(expr) ? expr : undefined
    }
    return undefined
  })()
  if (!obj) return undefined
  for (const el of obj.properties) {
    if (ts.isPropertyAssignment(el) && el.name.text === 'ru') return el.initializer
    if (ts.isShorthandPropertyAssignment(el) && el.name.text === 'ru') return el.name
  }
  return undefined
}

/** Directory-picker style: register(NS, localeVar, dictVar) inside for..of over literal tuples. */
function dictFromForOf(call, file) {
  let node = call.parent
  while (node && !ts.isForOfStatement(node)) node = node.parent
  if (!node || !ts.isIdentifier(node.expression)) return undefined
  const hit = resolveIdent(node.expression.text, file)
  if (!hit || !ts.isArrayLiteralExpression(hit.expr)) return undefined
  for (const tuple of hit.expr.elements) {
    if (ts.isArrayLiteralExpression(tuple) && tuple.elements.length === 2 &&
        ts.isStringLiteral(tuple.elements[0]) && tuple.elements[0].text === 'ru') {
      return tuple.elements[1]
    }
  }
  return undefined
}

const namespaces = new Map() // ns -> { dict: Map, sources: [{file, export}] }
const problems = []

function recordDict(ns, dictExpr, dictFile) {
  const dict = dictFromExpr(dictExpr, dictFile, new Set())
  if (!dict) { problems.push(`unresolved dict for "${ns}" in ${path.relative(ROOT, dictFile)}`); return }
  if (!namespaces.has(ns)) namespaces.set(ns, { dict: new Map(), files: new Set() })
  const entry = namespaces.get(ns)
  entry.files.add(path.relative(ROOT, dictFile))
  for (const [k, v] of dict) entry.dict.set(k, v)
}

for (const file of collectSources(path.join(ROOT, 'packages'))) {
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
        const dictExpr = ts.isStringLiteral(second) && second.text === 'ru'
          ? third
          : dictFromForOf(node, file)
        if (dictExpr) recordDict(ns, dictExpr, file)
        else problems.push(`unresolved 3-arg dict for "${ns}" in ${path.relative(ROOT, file)}`)
      } else if (second !== undefined) {
        const dictExpr = ruFromDictsArg(second, file)
        if (dictExpr) recordDict(ns, dictExpr, file)
        else problems.push(`no ru dict for "${ns}" in ${path.relative(ROOT, file)}`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

// Orphan sweep: exported ru-shaped consts never consumed by a registered dict.
const orphans = []
for (const file of collectSources(path.join(ROOT, 'packages'))) {
  const info = parseFile(file)
  for (const [name, init] of info.exported) {
    if (!/^(ru|.*Ru|.*Russian.*)$/.test(name) || !ts.isObjectLiteralExpression(init)) continue
    if (!consumed.has(`${file}#${name}`)) orphans.push(`${path.relative(ROOT, file)}: ${name}`)
  }
}

const ruJson = {}
const sources = {}
let total = 0
for (const [ns, entry] of [...namespaces.entries()].sort()) {
  ruJson[ns] = Object.fromEntries(entry.dict)
  sources[ns] = { files: [...entry.files].sort(), keys: entry.dict.size }
  total += entry.dict.size
}

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(path.join(OUT_DIR, 'ru.json'), JSON.stringify(ruJson, null, 2) + '\n')
fs.writeFileSync(path.join(OUT_DIR, 'ru.sources.json'), JSON.stringify(sources, null, 2) + '\n')

console.log(`namespaces: ${namespaces.size}, keys: ${total}`)
console.log('written: i18n/ru.json, i18n/ru.sources.json')
if (dynamicEntries.length) {
  console.log('\nnon-string entries skipped:')
  for (const d of dynamicEntries) console.log(`  ${path.relative(ROOT, d.file)} ${d.key ?? ''} ${d.note}`)
}
if (orphans.length) {
  console.log('\nunconsumed ru-shaped exports:')
  for (const o of orphans) console.log(`  ${o}`)
}
if (problems.length) {
  console.log('\nunresolved:')
  for (const p of problems) console.log(`  ${p}`)
}

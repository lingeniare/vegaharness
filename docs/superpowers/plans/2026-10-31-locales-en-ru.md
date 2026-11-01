# Locales: keep only EN + RU, EN as base, OS-language setup — Implementation Plan

**Goal:** Ship exactly two product languages — English (base/fallback) and Russian — and reduce the documentation corpus to English only; installer and first-run setup follow the OS language (RU on a Russian OS, EN otherwise).

**Decisions already taken with the user:**
- Scope = product + docs → docs become EN-only (all `.zh.md` / `.i18n.yaml` and the pairing infrastructure are removed).
- `en` and `ru` are both required baseline dictionaries in every typed `locale.register(ns, …)` call (`LOCALE_IDS = ['en','ru']`); `en` is the key-set source of truth and the terminal fallback.
- The language-pack API (`addLanguage` + single-locale `register(ns, locale, dict)`) stays for external plugins.

## Acceptance criteria

1. No `.zh.md`, `.i18n.yaml`, or `*/locale/{zh,ja,es,fr,de,pt}*.json` files remain in the tracked tree.
2. `SHIPPED_LOCALE_IDS = ['en','ru']`; `LOCALE_IDS = ['en','ru']`; every namespace dictionary supplies `en` + `ru`; key types derive from `typeof en`.
3. The Language row offers exactly English and Русский (plus any plugin-added packs); `<html lang>` follows the active id with no `zh` special case.
4. NSIS installer ships `en_US` + `ru_RU` only and auto-selects the OS language (Russian OS → ru, anything else → en); `CFBundleLocalizations = ['en','ru']`; desktop shell dictionaries = `{ en, ru }`.
5. A stored `locale.preference` for a removed id resolves through OS/browser detection to `en`/`ru` — no crash, no migration (upgrade guide documents it).
6. Website and docs are single-locale English; all `translation-*`/pairing scripts, gates, manifests, fixtures, and `docs/i18n/` are gone; EN docs no longer carry `中文` switcher links.
7. Gates green: `pnpm run typecheck`, `pnpm run lint`, unit tests for touched packages, `pnpm run doc-sync` / `test:docs`, `pnpm run check:i18n`, `verify-locale-metadata`, `verify-installer-locales`, `verify-upgrade-guides`, `pnpm run build:artifacts` + `build:check`.

## Task 1 — `packages/client/locale` core

**Files:**
- Modify: `src/locale-settings.ts` — `LOCALE_IDS = ['en','ru']`
- Modify: `src/locales/index.ts`, `src/locales/settings.ts` — `en` becomes the key source (`CommonKey`/`SettingsLocaleKey = keyof typeof en`), `ru` satisfies it
- Delete: `src/locales/{zh,ja,es,fr,de,pt}.ts`, `locale/{zh,ja,es,fr,de,pt}.json`
- Modify: `src/client/index.ts` — imports `{en, ru}`; `BUILT_IN_LOCALE_METADATA` gains `ru` (fallback `en`); remove the `addLanguage` loop for ja/es/fr/de/ru/pt; drop the `zh`→`zh-CN` case in `syncDocumentLanguage`; register `{ en, ru }`
- Modify: `tests/*`, `README.md`

Verify: package tests + `pnpm run typecheck` for the package.

## Task 2 — Feature-package dictionaries (codemod + fixups)

~76 files export `const zh`; ~120 use `keyof typeof zh`; ~107 `locale.register` call sites; 9 files compose partial dicts (`frequencyZh`/`…Ru` spreads).

Codemod over `packages/**/*.ts` (src + tests):
- delete top-level `zh|ja|es|fr|de|pt` object-literal declarations (incl. leading JSDoc and per-language partials like `frequencyZh`)
- `keyof typeof zh` → `keyof typeof en`; strip `satisfies`/type annotations on `en` that referenced removed key types
- rewrite register dict objects to `{ en, ru }`; drop removed specifiers from imports
- second pass: typecheck, fix strays (composition files, tests registering `{zh, en}` fixtures → register `{en, ru}` or an external pack id)

Verify: `pnpm run typecheck`; `pnpm run lint`; grep shows no `const zh`/`keyof typeof zh`/`, ja,` leftovers in `packages/*/src`.

## Task 3 — Package metadata locales

- Delete `packages/**/locale/{zh,ja,es,fr,de,pt}.json` (~1,780 files in ~297 dirs).
- `scripts/shipped-locales.ts` → `['en','ru']`; `verify-locale-metadata.ts` drops zh handling (expected = en only); update `shipped-locales.spec.ts`, `verify-locale-metadata.spec.ts`, `locale-dictionary-parity.spec.ts`.

Verify: `pnpm run check:i18n` + `pnpm run verify-locale-metadata`.

## Task 4 — Desktop app + installer

- `apps/desktop/src/locale.ts`: keep `{en, ru}`; `DesktopLocale.id` → `'en'|'ru'`; simplify `resolveDesktopLocale`.
- `apps/desktop/installer/locales/`: keep `en_US.json`, `ru_RU.json`; `scripts/installer-locales.mjs` required list → both.
- `installer.nsh`: remove `LANG_SIMPCHINESE` font block; audit `pages.nsh`/`theme.nsh`/`uninstall.nsh`/`window-frame.cpp`.
- `electron-builder-config.mjs`: `CFBundleLocalizations: ['en','ru']` (`installerLanguages` derives automatically).
- Update `apps/desktop/tests/*` locale/installer specs; audit `apps/desktop/renderer` for zh strings.

Verify: `pnpm run verify-installer-locales`; desktop unit tests.

## Task 5 — Test + e2e rewrites

- `packages/client/locale/tests/*` — en/ru cases; language-pack tests keep a synthetic external id (e.g. `it`).
- `apps/web/tests/desktop-locale.e2e.ts` — rewrite for en/ru + external pack; refresh its `expected/` snapshots.
- `apps/web/tests/*.e2e.ts` — replace zh/ja assertions, `openSettings(page,'zh')`, `zh-CN` lang expectations, localized golden files.
- Keyless session snapshots are model-facing EN — confirm unaffected.

## Task 6 — Docs → EN-only

- Delete `**/*.zh.md` (≈2,105) and `**/*.i18n.yaml` (≈2,088) repo-wide (`.agents`, `docs`, `packages`, `apps`, `native`, `python`, `benchmarks`, root, `scripts`, `.github`); delete `scripts/fixtures/translation-prompt/` and `scripts/snapshots/translation-prompt-v4/`.
- Scripted strip of `English | [中文](…)` / `中文 | [English](…)` switcher lines from remaining `.md` files.
- Delete `docs/i18n/`, `.agents/skills/dsh-translate-docs/`, `scripts/{translation-pairing,translation-pairing-git,translation-pairing-record,verify-translation-pairing,translation-links,translation-prompt,translation-prompt.spec,translation-prompt.expected.spec,verify-translation-prompt,translation-brief,translation-brief.spec,gen-translation-brief,translation-pairing.spec,translation-links.spec,paired-markdown-derivatives,paired-markdown-derivatives.spec,translation-pairing.manifest.json}`.
- `package.json`: drop `verify-translation-pairing`, `verify-translation-prompt`, `gen-translation-brief`; fix `doc-sync`, `test:docs`, `check:*` aggregates and `scripts/run-gates.ts`.
- `verify-upgrade-guides.ts` + spec: drop `guide.zh.md`/`.i18n.yaml` pair requirement.
- Website EN-only: `website/docs.ts` (`DocsLocale` → single), `.vitepress/config.ts` (one root locale, English), `scripts/project-doc-site.ts` + spec.
- Audit/fix zh references in: `archived-agent-notes.ts`, `agent-note-tree.ts`, `rescope-vendor.ts(+spec)`, `persistence-*.ts(+specs)`, `type-equiv.manifest.json`, `check-workspace-constraints.ts(+spec)`, `doc-standard.spec.ts`, `verify-concrete-terms*`, `verify-subsystem-pages*`, `verify-package-paths.spec`, `verify-default-product-isolation*`, `verify-mermaid`, `verify-md-links*`, `verify-md-wrap`, `verify-doc-refs`, `verify-doc-site-fragments`, `verify-doc-budgets`, `doc-typecheck`, `gen-{doc-graphs,cordis-catalog,module-graph,cli-help,config-catalog,plugin-record-catalog}`, `cordis-config-files*`, `build-exe-for-python-sdk`, `release/families.spec`.
- Update prose that encodes pairing: root `AGENTS.md`, `docs/AGENTS.md`, `packages/AGENTS.md`, `website/AGENTS.md`, `.agents/notes/README.md`, `.agents/skills/{dsh-doc,dsh-create-upgrade-guide,dsh-code-review,dsh-pr-description,…}` (archived notes stay frozen — only their `.zh.md` files disappear).
- Root zh pairs: `BRAND_GUIDELINES`, `CONTRIBUTING`, `README`, `SAFETY` (+ `.i18n.yaml`).

## Task 7 — Upgrade guide + closeout

- `docs/upgrade-guide/v0.2.2-alpha.2/removed-ui-locales/guide.md` (EN-only): shipped UI languages reduced to en+ru; `locale.preference` holding another id now resolves via OS/browser detection; language packs may re-add languages; plugin manifests should drop non-en/ru `locale/*.json` and dictionary entries.
- Update docs that enumerate shipped languages (`packages/client/locale/README.md`, web-client/subsystems/user docs as found by grep).
- Final gates per AGENTS.md (typecheck → lint → focused tests → doc-sync → check:i18n → build) via `dsh-pre-push-checks`; delete this plan file.

## Risks / review focus

- Stored `locale.preference: zh` → resolves to provisional (OS/browser) — verify one unit test covers it.
- External plugins registering `zh` dicts keep working (extra keys allowed); plugins *selecting* a removed built-in id fall back — documented in the upgrade guide.
- `ru` dicts that composed over removed partials (`frequencyRu` stays, `frequencyZh` goes) — codemod must not delete shared partials still imported by `ru`/`en`.
- Website single-locale switch changes every docs URL (`/en/…` → `/…`) — external links to `/en/` should redirect or land on root; decide in Task 6 (VitePress `rewrites`/redirect note in the guide).
- Coverage gate `test:coverage` is CI-owned; run touched-package tests locally only.

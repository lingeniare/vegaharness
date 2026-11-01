# i18n — Russian locale export

Static export of every Russian dictionary registered through
`ctx.locale.register()` across `packages/*/src` (client UI, session-query,
extensions, and experimental plugins).

- `ru.json` — `{ "<namespace>": { "<key>": "<Russian text>" } }`, sorted by
  namespace. Namespace names match the runtime `locale.register(ns, ...)`
  calls (`common`, `chat`, `conversation`, `settings.models`, …).
- `ru.sources.json` — for each namespace, the source files and key count, so
  a fork can map namespaces back to packages.
- `extract-ru-locale.mjs` — the generator. Re-run from the repo root after
  upstream syncs:

  ```sh
  node i18n/extract-ru-locale.mjs
  ```

- `apply-ru-locale.mjs` — writes the reviewed `ru.json` texts back into the
  source dictionaries. Use it after an upstream sync adds or rewrites the
  machine-translated `ru` entries:

  ```sh
  node i18n/apply-ru-locale.mjs          # rewrite ru literals in packages/*/src
  node i18n/apply-ru-locale.mjs --check  # report without writing
  ```

  Keys the tree added since the export keep their current text; export keys
  the tree's `en` dictionaries no longer declare are dropped (they would
  fail the `satisfies` key-set check). `[...].join('x')` and `'a' + 'b'`
  initializers are rewritten from the exported flat text.

Dictionaries may compose (`...frequencyRu`, shared `PRODUCT_NAMES`,
`onboardingRussianCopy`); the extractor resolves imports, re-exports, `as
const` wrappers, and spread chains, so the JSON contains the effective
runtime dictionary. Values keep `{placeholder}` templates verbatim.

After applying, run `pnpm run check:i18n` — the dictionary-parity gate
rejects texts that change `{placeholder}` names, `/command` tokens, or
`snake_case` literals relative to `en`, so a handful of exported entries
may need manual adjustment (see `scripts/shipped-locales.ts` for the token
rules).

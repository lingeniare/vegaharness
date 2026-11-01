---
kind: upgrade-guide
description: "The application UI ships English and Russian only, English is the canonical locale, and the documentation site is English-only."
---

# UI ships English and Russian only

## Change

The desktop and web UI no longer ship Chinese, Japanese, Spanish, French, German, or Portuguese dictionaries. English (`en`) is the canonical dictionary set and the terminal fallback; Russian (`ru`) is the only additional shipped locale. Setup and installation still follow the operating system language: a Russian OS selects Russian, and every other OS language selects English.

A stored preference naming a removed locale no longer fails; it falls back through automatic browser/OS detection, so affected users land on Russian or English. Language pickers list exactly English and Русский.

The documentation site publishes a single English tree. The `/en/` route prefix and the Chinese route tree are removed: an old `/en/<path>` URL now lives at `/<path>`, and `*.zh.md` counterpart files and `*.i18n.yaml` pairing sidecars no longer exist in the repository or on the site. Package `locale/` directories carry exactly `en.json` and `ru.json`, and `meta.detail` points at one shared English document.

## Migration

1. Deployments that pinned a removed locale in `cordis.yml`, overlays, or settings change the value to `en` or `ru`; unrecognized values already fall back to OS detection. Confirm the app launches without a locale error and shows the expected language.
2. Update documentation links: remove the `/en/` segment from site URLs and delete references to `.zh.md` files. Check one previously Chinese page, such as the root index, now serves English.
3. Plugin and package authors keep `locale/en.json` and `locale/ru.json` only; delete other `locale/<id>.json` files and point every `meta.detail` at the shared English document. `pnpm run doc-sync` verifies the layout.

---
kind: upgrade-guide
description: "The Desktop update channel selection is removed; updates always use stable."
---

# Desktop stable-only updates

## Change

The Desktop update channel selection is removed. Packages, update feeds, and upload tooling always use `stable`; the `nightly` channel no longer exists. The Settings → General update-channel row, its IPC surface (`dsh-desktop:updates-channel-*`), the `updates.channel` settings field, the `dshDesktopUpdateChannel` package manifest field, and the `DSH_DESKTOP_UPDATE_CHANNEL` environment variable are removed. Saved `updates.channel` values are ignored; a stored `nightly` silently selects the stable feed. GitHub Releases uploads publish normal releases (`prerelease: false`, `make_latest: legacy`); the updater rejects prerelease versions (`allowPrerelease: false`).

## Migration

1. Remove `update_channel` selections from packaging workflows and `DSH_DESKTOP_UPDATE_CHANNEL` from release environments. Packaging and upload now always produce `stable.yml` / `stable-mac.yml`.
2. Remove any `updates.channel` entry from Desktop `settings.json` before upgrading, or leave it: it is preserved but inert.
3. Republish only through the updated tooling. A previously published `nightly.yml` feed receives no further updates; nightly installs upgrade to stable only through a manual install or a stable feed they were already pointed at.

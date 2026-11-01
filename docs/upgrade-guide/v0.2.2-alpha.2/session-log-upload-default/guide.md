---
kind: upgrade-guide
description: "Session-log upload to the official DeepSeek API now defaults to off and needs an explicit opt-in."
---

# Session-log upload defaults to off

## Change

`@deepseek-ai/dsh-session-log-deepseek` used to contribute the incremental `dsh_session_log` request field whenever a profile mounted the plugin without an explicit `enabled` value. The contribution now requires `enabled: true`; shipped profiles still mount the plugin but send nothing until the setting is turned on. Every composition that mounts the plugin without an explicit `enabled` is affected, including fresh `$DSH_HOME` profiles and the shipped `sdk`, `sdk-minimal`, `web`, and `headless` compositions. A profile whose user already toggled the Web switch keeps its recorded value. See [Session-log upload](../../../../packages/session/session-log-deepseek/README.md#configuration).

## Migration

1. To keep uploading Session logs, set `enabled: true` on the `session-log-deepseek` row in the active profile's `cordis.patch.yml`, a home patch, or a command-line overlay, or turn on **Settings → General → Upload Session Log when using the official model API** in the Web app.
2. Confirm by sending one model request and checking that its body carries `dsh_session_log`, or that the Session log gains a `session-log-deepseek/delivery-accepted` event after a successful request. No action is needed to keep upload off.

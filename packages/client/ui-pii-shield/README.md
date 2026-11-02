---
description: "Composer PII-shield control for the VEGA route: the shield indicator left of the model selector that reflects and drops the server-side anonymization flag; for users and maintainers of the privacy experience."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-pii-shield

## Summary

The composer PII-shield control shows and toggles whether personal data in the prompt and attached documents is anonymized on the VEGA route. It sits in the `conversation.input.right` seat, left of the model selector: accent shield-check when protected, muted shield-x when not — both states clickable. Off by default. The control reads and writes the `anonymize` volatile field of the `llm-vega-account` Host entry through the shared settings document, so its state matches the `X-Vega-Anonymize` header the next request carries.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount this plugin alongside `ui-conversation`, `ui-settings`, and the VEGA account route; the shield then appears left of the model selector once the settings document reports the `llm-vega-account` namespace. The anonymization itself is server-side: with `X-Vega-Anonymize: true` and a stable `X-Vega-Session`, api.vega.chat replaces personal data with placeholders before forwarding the request and restores the originals in the response. The flag defaults to off, so the user opts in once — clicking the shield writes `anonymize` and the very next VEGA request — chat or auxiliary search/fetch — follows it.

### Failures

A refused or failed settings write keeps the previous state and raises a screen-reader status line; while the settings namespace is loading or not served, the seat renders nothing rather than claiming a protection state it cannot verify.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The seat's inject face binds the shared `ConfigForm` snapshot of the `llm-vega-account` namespace as the `usePiiShield` hook and a `toggle` callback that queues `anonymize` writes through the settings write queue (revision-fenced, latest-write-wins). The component derives the protected state from the accepted section, never from local optimism: a write the Host refuses leaves the indicator untouched. On the Host side the `anonymize` field is volatile, so the settings document publishes it to the client and the `VegaAdapter` reads it per request through a resolver; `dsh-web-vega` reads the same entry's effective config for its auxiliary calls.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the shield control is not enough. They move from the composer indicator to the route it reflects and the transport that enforces it.

- [dsh-llm-vega-account](../../llm/llm-vega-account/README.md) — the VEGA route whose `anonymize` volatile field this control writes and whose adapter sends `X-Vega-Anonymize`.
- [dsh-web-vega](../../web/web-vega/README.md) — auxiliary VEGA search/fetch calls following the same shield flag.
- [ui-conversation](../ui-conversation/README.md) — declares the `conversation.input.right` slot this package fills.
- [ui-settings](../ui-settings/README.md) — the settings document mirror and `ConfigForm` write queue the control uses.
- [Client package map](../README.md) — adjacent browser UI packages.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the `anonymize` settings field the toggle writes; the `llm-vega-account` adapter owns the model-visible effect — whether personal data in prompt and document content leaves the machine as placeholders restored on the way back.

#### KV Cache effect

None. The flag selects a request header; it does not change prompt content as logged.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define the current shield control. They are current package constraints, not a VEGA comparison or a task backlog.

- **Off by default** — anonymization is opt-in: until the user arms the shield once (composer or the provider settings section), VEGA requests carry no `X-Vega-Anonymize` header.
- **Flag is not enrollment proof** — the indicator reflects the `anonymize` opt-in the client can observe. Whether the account key is actually enrolled for shielding is a server-side property the route does not yet publish, so the active state means "requests carry the anonymization header," not an independent attestation.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

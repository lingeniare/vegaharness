---
description: "The account-managed api-vega model route: pi-ai transport against api.vega.chat, live /models discovery, X-Vega-Session attribution, PII-shield and error translation."
kind: "package-reference"
---

# @deepseek-ai/dsh-llm-vega-account

## Summary

With `dsh-llm-vega-account`, the harness talks to VEGA (`api.vega.chat/api/v1`, an OpenRouter-compatible proxy) over the shared pi-ai transport. The route registers as `api-vega` with `accountManaged: true`, so settings pages show a signed-in account row without Edit/Delete controls and the catalog orders it first. The managed key resolves per request through `ctx.deepseekAccount`; a rejected key returns to the sign-in flow. Models come from a live `GET /models` listing — an empty whitelist removes the provider from pickers. Requests carry `X-Vega-Session` attribution and optional `X-Vega-Anonymize` when the PII shield is enabled. Defaults: `1_000_000` context, `128_000` max output when the listing omits sizes.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the provider alongside the VEGA account service; the route activates as soon as sign-in commits a managed key.

### Minimal configuration

```yaml
- id: llm-vega-account
  name: '@deepseek-ai/dsh-llm-vega-account'
```

`anonymize` sends the PII-shield header; it defaults to off, so anonymization is opt-in. It is volatile, so the settings document publishes it to the Web GUI: the composer shield control (`dsh-client-ui-pii-shield`) and the provider settings section both write it, and the adapter re-reads it per request. `dsh-web-vega` auxiliary calls follow the same field through the running entry's effective config. Listing timing and retry policy fields mirror the DeepSeek account provider.

<a id="model-experience"></a>
## Model Experience

### VEGA request

#### What the model sees

Requests are ordinary OpenAI-completions turns: the harness system prompt, message history, tool schemas, and call config arrive unchanged. The provider adds `X-Vega-Session` attribution and optional `X-Vega-Anonymize` headers only — no adapter-authored prompt prose.

#### Token effect

Provider tokenization governs exact input; the adapter adds no tokens beyond the model's own serving, and reported usage remains authoritative.

#### KV Cache effect

An unchanged assembled prefix is eligible for VEGA cache reuse; the provider adds no prompt-varying fields, so reuse follows the same rules as the shared transport.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- An empty server whitelist removes the provider from every picker.
- Live listing and key validation need a real VEGA account; unit coverage exercises the transport seams rather than the remote API.

<a id="dev-note"></a>
### Dev Note

The provider mirrors the `llm-deepseek` account route shape on the `api-vega` route so model pickers, retries, and listing logic stay shared. It reads only the stored `sk-apivega-...` managed key from `@deepseek-ai/dsh-vega-account`; a missing or ineligible grant rejects the request with a sign-in prompt rather than falling back to another route.

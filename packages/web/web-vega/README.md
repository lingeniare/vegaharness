---
description: "The VEGA account-managed search and fetch providers for ctx.web: auxiliary chat/completions calls carrying openrouter:web_search and openrouter:web_fetch server tools."
kind: "package-reference"
---

# @deepseek-ai/dsh-web-vega

## Summary

With `dsh-web-vega`, the harness searches and fetches the web through VEGA's OpenRouter-compatible server tools. Each operation is one auxiliary `chat/completions` turn on the `api-vega` route carrying `{"type":"openrouter:web_search"}` or `{"type":"openrouter:web_fetch"}`, authenticated with the account managed key. The auxiliary model defaults to the initiating request's own model — guaranteed on the account whitelist — with a configured fallback. Every request is recorded to the session as a secret-free `web/vega-search-llm-request` / `web/vega-fetch-llm-request` event before dispatch, and credential-bearing requests reject redirects before any target is contacted. Pin it through `searchProvider: api-vega` / `fetchProvider: api-vega`; `ctx.web` performs no readiness fallback.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the provider next to the web service and pin the selection, alongside the VEGA account and model route.

### Minimal configuration

```yaml
- name: '@deepseek-ai/dsh-web'
  config:
    searchProvider: api-vega
    fetchProvider: api-vega
- name: '@deepseek-ai/dsh-web-vega'
```

`anonymize` forwards the PII-shield header; `model`/`maxTokens` bound the auxiliary turn.

<a id="model-experience"></a>
## Model Experience

### Auxiliary VEGA request

#### What the model sees

Each search or fetch costs one non-streamed auxiliary model turn whose input never enters the conversation. The auxiliary model receives the search query or fetch target plus its own tool surface; server-side retrieval happens inside VEGA, and the conversation tool result carries the extracted answer text plus citeable URLs.

#### Token effect

The auxiliary turn's tokens are billed by VEGA but do not accumulate in Session context; `model`/`maxTokens` bound each call, and the conversation sees only the compact extracted answer.

#### KV Cache effect

Auxiliary turns are independent single requests with no shared conversation prefix, so conversation KV cache is unaffected; VEGA-side reuse is opaque to the harness.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The provider is usable only while the account is signed in and the initiating request runs on `api-vega`; `ctx.web` pins the selection — deployments choose DeepSeek or key-based providers through web-search settings.
- Redirect rejection applies to every request this provider makes.

<a id="dev-note"></a>
### Dev Note

Search and fetch ride the same auxiliary `api-vega` model route that `llm-vega-account` serves; this package owns only the request/response mapping against VEGA retrieval endpoints, never its own credential path. Results carry citeable URLs because VEGA performs retrieval server-side — the provider must not drop the URL list when a deployment truncates the answer text.

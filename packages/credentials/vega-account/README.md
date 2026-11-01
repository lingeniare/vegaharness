---
description: "The VEGA account service behind the deepseekAccount seam: device-flow sign-in against api.vega.chat, managed key mint/revoke, profile and RUB balance, device identity migration."
kind: "package-reference"
---

# @deepseek-ai/dsh-vega-account

## Summary

With `dsh-vega-account`, the harness signs the user in to VEGA (`api.vega.chat`) through the device authorization flow and exposes the result through the existing `ctx.deepseekAccount` service seam. Sign-in surfaces a `userCode` plus a VEGA device URL, polls the token endpoint, mints a `sk-apivega-...` managed key into the credential store; sign-out revokes the grant server-side. Profile, contact, and RUB wallet data come from the VEGA account endpoints. `AccountView.embeddedPages` is `false`, so usage and top-up actions open in the external browser at configured `usageUrl`/`topUpUrl`. The legacy DeepSeek device identity migrates into the VEGA record so analytics identity survives the switch.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the service under the `deepseek-account` plugin id so consumers of `ctx.deepseekAccount` see the VEGA implementation.

### Minimal configuration

```yaml
- id: deepseek-account
  name: '@deepseek-ai/dsh-vega-account'
```

Defaults target `https://api.vega.chat` with device-flow `clientId: vegaharness` and `scope: api`. `platformOrigin` and `allowLoopbackHttp` exist for development mocks.

<a id="model-experience"></a>
## Model Experience

None, as account credentials affect HTTP authentication and never enter model prompts, Session logs, or tool results.

#### KV Cache effect

No model request prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- VEGA has no embeddable authorized pages, so billing and usage navigation always leaves the app.
- Device-flow unit coverage uses loopback mocks; live verification requires a real VEGA account.

<a id="dev-note"></a>
### Dev Note

The service keeps the `ctx.deepseekAccount` seam contract so existing consumers switch backends without call-site changes: sign-in still returns a `userCode` flow, and the stored credential remains a `sk-apivega-...` managed key in the shared credential store. Device identity migrates one-way into the VEGA record on first sign-in; the legacy record is preserved for rollback.

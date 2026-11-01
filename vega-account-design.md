# Design: VEGA sign-in and the `api-vega` model provider

Date: 2026-10-30. Status: pending approval.
Spec: `connect-app.md` (device flow, path B; application registered server-side as `vegaharness`).

## Intent

The user wants the product's single "Sign in" to authenticate against `api.vega.chat`
and to leave the application holding an OpenRouter-compatible `sk-apivega-...` key
without any manual key entry. The Models page must present a protected
**API VEGA** provider card (no Edit / no Delete), and the model picker must list
exactly the models `GET /api/v1/models` returns for the app-managed key — a list
the VEGA server already narrows to the `VEGAHARNESS_ALLOWED_MODELS` whitelist.

## Goals

- `Sign in` runs the VEGA device flow (`client_id=vegaharness`): request device
  code, show `user_code` + verification link, poll `/api/auth/device/token`,
  exchange the session token at `POST /api/v1/keys/vegaharness` for the named key.
- The `sk-apivega-...` key is committed to the credential store and never appears
  in UI, settings documents, or logs.
- Model requests go to `https://api.vega.chat/api/v1` with `Authorization: Bearer`
  and a stable per-session `X-Vega-Session` header.
- The model picker shows exactly the whitelist `GET /api/v1/models` returns; the
  Models page shows `API VEGA` with the account "signed in" treatment.
- Sign-out revokes the key via `POST /api/v1/keys/vegaharness/revoke` and removes
  the local record; account models disappear.
- Account section shows email and balance (RUB) from VEGA's `/api/v1/account`.
- `web_search`/`web_fetch` keep working, but only on the `api-vega` route: the
  `ctx.web` selection gains VEGA providers driven by the OpenRouter server tools
  `openrouter:web_search`/`openrouter:web_fetch`, enabled by default once the
  account key exists and switchable in Settings → Web search.

## Non-goals

- Server-side work: `vegaharness` registration, key routes, and the model
  whitelist already exist on api.vega.chat.
- The PKCE `/auth` path (path C) and the guard-URL path (path A) — device flow is
  the only path that yields a named app key with whitelist.
- Enabling the PII shield for `vegaharness`: that is a server-side
  `PII_SHIELD_KEY_NAMES` decision. The client ships the header plumbing and a
  config flag, off by default.
- Removing `deepseek-official` (manual `DEEPSEEK_API_KEY`) or the dormant
  `llm-pi-ai` catalog — the user chose to keep every provider.
- Embedded native platform pages (`dshPlatform` bridge) for VEGA.

## Anti-goals

- Never log or render the key value; never write it into the user-editable
  settings document or a `credentialRef` env name.
- No hardcoded model list, no hardcoded provider whitelist on the client.
- No second account seam or parallel sign-in UI: VEGA replaces the account
  implementation, not the account contract.

## Constraints

- `ctx.deepseekAccount` is the single account seam; consumers
  (`account-controller` → `remote.account.*`, `ui-settings-account`, desktop
  welcome, `installAccountTaskCancellation`) must keep working without wire or
  API changes beyond additive fields.
- The `authorization` seam owns attempt lifecycle; a flow commits its
  `CredentialRecord` during `run()` or `NOT_COMMITTED` is raised.
- Repo rules: plugin packages only, `ctx.get` for optional services, no module
  singletons, registrations via `ctx.effect`, locale-owned UI copy, additive
  wire-compatible type changes, real-composition tests for product-visible
  plugins.
- VEGA `GET /models` for the app key already applies the whitelist; when the env
  list is empty the server returns an empty catalog (fail-closed) — the provider
  must survive an empty listing gracefully.
- Provider id `api-vega`, display name `API VEGA`.

## Approaches considered

- **A (chosen): swap the account implementation behind the existing seam, add a
  dedicated VEGA provider over `PiAiAdapter`.** New `dsh-vega-account` implements
  `DeepSeekAccount` through the device flow; new `dsh-llm-vega-account` registers
  route `api-vega` driven by the live `/models` listing; UI special-casing moves
  from the literal `'deepseek-account'` to a directory flag `accountManaged`.
- **B: parallel second account next to DeepSeek.** Rejected — one `deepseekAccount`
  service and one sign-in surface; the spec wants Sign in to mean VEGA, not a
  choice between two account systems.
- **C: static `llm-pi-ai` profile** (`apiKeyEnv` + fixed models). Rejected —
  models must come from the live server whitelist, the key must come from the
  device flow (a record, not an env reference), and profile-driven providers are
  editable, which violates the no-Edit/no-Delete requirement.

## Design

### 1. `@deepseek-ai/dsh-vega-account` — new package at `packages/credentials/vega-account`

Implements the existing `DeepSeekAccount` service (mounted as
`ctx.deepseekAccount`; the service name is part of the seam and stays).

Config (zod-validated, no hardcoded tunables): `platformOrigin` (default
`https://api.vega.chat`, loopback http allowed for tests), `clientId` (default
`vegaharness`), `keyRoute` (defaults to `clientId`), `deviceScope` (default
`api`), `requestTimeoutMs`, `pollIntervalCapMs`, `attemptTimeoutMs`,
`logoutPolicy` (revocation retry budget, mirroring the platform implementation),
`links.usageUrl` / `links.topUpUrl` (default `${origin}/dashboard`).

Credential record: `credentialKey('vega-account', 'default')` →
`{ kind: 'grant', payload: { version: 1, token: 'sk-apivega-…', issuer: origin } }`
(same shape the platform implementation validates; scope `vega-account` owns it).

`startSignIn(client, callbackOrigin, loginSource)` keeps the platform
implementation's attempt shape — `initializing` → `waiting-browser` →
`exchanging` → `committing` → `succeeded`/`cancelled`/`expired`/`failed` — with
the same join-in-flight and cancel-outside-committing rules, driven through
`ctx.authorization.begin`. The registered flow:

1. `POST {origin}/api/auth/device/code` `{client_id, scope}` → zod-parse
   `{device_code, user_code, verification_uri, verification_uri_complete,
   expires_in, interval}`; relative `verification_uri` resolves against the
   origin.
2. `update(attempt, { phase: 'waiting-browser',
   authorizeUrl: verification_uri_complete ?? verification_uri,
   userCode: user_code, expiresAt: now + expires_in*1000 })` — `authorizeUrl`
   feeds every existing surface (web pre-opened tab, desktop
   `shell.openExternal`, both copy-link buttons).
3. Poll `POST /api/auth/device/token` `{grant_type:
   'urn:ietf:params:oauth:grant-type:device_code', device_code, client_id}` every
   `interval` s; `authorization_pending` → keep waiting, `slow_down` → +5 s
   (RFC 8628), `expired_token`/`access_denied` → terminal phase, `expiresAt`
   deadline → `expired`. Success parses `{access_token, token_type?}` leniently;
   an unrecognized `{error}` value maps to `protocol`.
4. `phase: 'exchanging'` → `POST {origin}/api/v1/keys/{keyRoute}` with
   `Authorization: Bearer <session-token>` → `{id, key}`; a response whose `key`
   is absent or lacks the `sk-apivega-` prefix fails the attempt as `protocol`.
5. `phase: 'committing'` → `session.commit(record)`; seam verifies the write and
   reports `authorized`.

Remaining members: `cancelSignIn` (abort + `authorization.cancel`, never during
`committing`); `signOut` (cancel attempt, delete record, emit
`deepseek-account/signed-out`, background `POST keys/{keyRoute}/revoke` with the
old Bearer and retry budget — a key that outlives the budget is cleaned by the
next mint, which revokes the previous key of the same name per server
invariant 3); `getState`/`watch` (same `AccountView` projection, links from
config); `getProfile` → `GET /api/v1/account` lenient-parse `{id, email, name}`
→ `AccountProfile`; `getBalance` → the same `GET /api/v1/account` response's
balance field → `[{currency:'RUB', balance}]`, empty `bonusWallets` (spec
documents balance on `/account`; `/credits` is not used);
`getUnnotifiedBonuses` → `null`, `ackBonusNotified` → `false`;
`resolveToken(url)` → token when `new URL(url).origin === platformOrigin`;
`rejectToken(token)` → delete matching record + `deepseek-account/session-expired`;
`getPlatformSession` → `null` — VEGA has no embeddable authenticated pages (see
§5); `getDeviceIdentity` → on first read, copies the device UUID value from a
legacy `deepseek-account-platform/device` record if present (analytics identity
continuity), then keeps it under its own `vega-account/device` scope; the
orphaned legacy grant record is left in place (rollback-safe);
`installAccountTaskCancellation` (see §3). No `webServer` dependency — the
device flow has no callback. If `session.commit` fails after a successful key
mint, the flow best-effort `POST`s `keys/{keyRoute}/revoke` with the session
token before failing the attempt.

### 2. `@deepseek-ai/dsh-llm-vega-account` — new package at `packages/llm/llm-vega-account`

Config: `baseURL` (default `https://api.vega.chat/api/v1`), `modelsTimeoutMs` /
`modelsMaxAgeMs` (reuse `modelListingConfigFields` + `resolveListingTiming`),
`anonymizePii` (default `false` — flips on the shield headers when the server
adds `vegaharness` to `PII_SHIELD_KEY_NAMES`).

Listing: reuse `createModelListingCache(ctx, name, 'api-vega', …)` from
`dsh-llm-deepseek` (generic credential-scoped cache: single-flight, TTL refresh,
rescope on credential change, `llm/models-updated` on change) with
`url = `${baseURL}/models``, `credential` = `deepseekAccount.resolveToken`, and a
`load` that fetches with `Authorization: Bearer` and parses the OpenRouter shape
`{data: [{id, name, description?, context_length, architecture:
{input_modalities, output_modalities}, top_provider.max_completion_tokens?,
supported_parameters?}]}` into `ModelListing` (`ListingEntry.facts`:
`inputModalities`, `contextWindow`, `maxOutputTokens`; skipped-row counting for
malformed entries).

Profiles: memoized `resolveProfiles({ 'api-vega': { api: 'openai-completions',
baseURL, displayName: 'API VEGA', models: entries.map(toPiModelProfile),
defaultInput: ['text'] } }, 'deferred')`. Mapping: `id`, `name`, `contextWindow`,
`maxTokens` ← `top_provider.max_completion_tokens` (a real model cap, safe as
the per-request default), `input` ← `architecture.input_modalities`
(`image` → include `image`, else `['text']`). Reasoning-effort mapping from
`supported_parameters` is deferred — models still work without effort knobs.

Adapter: `class VegaAdapter extends PiAiAdapter` — construction options
`profiles`, `resolveApiKey` (`resolveToken(baseURL)` → key; `undefined` →
`LlmError('MISSING_CREDENTIAL')`, which makes `listModels` answer `[]` while
signed out and stores the resolved token on the instance so a later 401 can be
correlated to the exact credential it came from), `auth` (the pi-ai↔harness
bridges), `prepareHeaders` (stamps `X-Vega-Session: options.sessionId` when the
call carries one — it can be absent on auxiliary calls, in which case the
server derives the session from the first user message; `X-Vega-Anonymize: true`
when `anonymizePii`, then delegates through
`ctx.waterfall('llm-pi-ai/request-headers')`),
`resolveAttachments`/`resolveImageAccess`/`onReplayDegrade` mirroring
`llm-pi-ai`'s own wiring.

Listing loads are driven through the cache like the account route does: a
private `catalog(signal)` awaits `cache.view(settings, signal)` so the first
caller (catalog build, `initializeDefaultModel`, a stream) triggers and awaits
the fetch instead of reading an empty `current()`; `listModels`, `prepareCall`,
and `stream()` await it before delegating to `super`.

`VegaAdapter` also overrides `stream()` and the stream inside `prepareCall()`
to translate request errors on **both** delivery paths:

- Thrown errors (pre-stream failures, including `MISSING_CREDENTIAL` from
  `resolveApiKey`) are re-thrown as `ACCOUNT_SIGN_IN_REQUIRED` when the account
  token is absent — that is the only missing-credential case this adapter can
  have, and the thrown code is what `installAccountTaskCancellation` observes
  to emit `deepseek-account/model-sign-in-required` (in-band finish chunks do
  not reach that listener).
- In-band finish/error chunks are inspected: HTTP 401 →
  `deepseekAccount.rejectToken(capturedToken)` (the service deletes only while
  the stored record still matches, so a racing fresh sign-in is safe) +
  thrown `ACCOUNT_TOKEN_INVALID`; 402 → `ACCOUNT_QUOTA_EXCEEDED_CODE`;
  `{error:{code:'pii_*'}}` → `PII_*` `LlmError`s preserving the status class
  (503 retry-classified, 400/413/422 terminal). Whether the status and error
  code survive pi-ai's `errorMessage` flattening is verified during
  implementation; if they do not, `classifyPiAiError`-adjacent detail
  propagation is added in `llm-pi-ai` as the owned seam.

Wrapping the subclass needs no error hook inside `llm-pi-ai`.

Registration (all unconditional — dormant-by-data like the account route):
`ctx.llm.registerAdapter(['api-vega'], adapter)`;
`ctx.llm.registerConfigurableProviders([{ provider: 'api-vega',
displayName: 'API VEGA', settingsNs: <plugin id>, settingsPath: [],
accountManaged: true, ...anonymizePii ? { piiShielded: true } : {} }])`;
`ctx.llm.registerModelDiscovery(settingsNs, …)` answering `api-vega` requests
from the listing view.

`llm-pi-ai` exports to add (already-written internals, publicized):
`resolveProfiles`, `credentialStoreFrom`, `authContextFrom` — the file's own
contract anticipates "another adapter family" sharing the credential/auth
seams.

### 2b. `@deepseek-ai/dsh-web-vega` — new package at `packages/web/web-vega`

Registers VEGA-backed providers into the existing `ctx.web` seam — the same
shape `web-search-deepseek` uses: each operation is an **auxiliary** model call
(the harness `web_search`/`web_fetch` tools and their logging/UI do not change),
and the server tool runs inside that auxiliary request:

- Search provider `'vega'`: `ready(route)` → `route === 'api-vega'` and
  `deepseekAccount.resolveToken(origin)` yields a token. `search(request)` →
  `POST {platformOrigin}/api/v1/chat/completions` with
  `tools: [{type: 'openrouter:web_search'}]`, `Authorization: Bearer`, the
  session's `X-Vega-Session`, and the model from
  `session.requestContext().model` (Config `model` as explicit fallback) —
  using the request's own model guarantees a whitelisted id. The answer text
  and its citation annotations fold into the seam's source/result shape.
- Fetch provider `'vega'`: same readiness and transport, with
  `{type: 'openrouter:web_fetch'}` and the URL list from the fetch request.
- Both reject redirects on the credentialed client (packages/web rule) and
  append a logged auxiliary-request event — `web/vega-search-llm-request` and
  `web/vega-fetch-llm-request` mirror `web/deepseek-search-llm-request` (added
  to `known-event-types.ts` and the `SessionEventMap` merge), satisfying
  model-visible ⟺ logged.
- Config: `platformOrigin` (default `https://api.vega.chat`), `model`
  (optional override), `search`/`fetch` registration flags, `maxTokens`,
  `maxUses`, timeouts — all zod-validated.

Selection: `cordis.patch.yml` sets the `web` service config
`searchProvider: 'vega'` / `fetchProvider: 'vega'`, so after sign-in the tools
are on by default; `ui-settings-web-search` gains a third provider choice
"API VEGA" (disabled until the account is signed in) writing the same `web`
selection namespace — the existing switch semantics apply unchanged. Signing
out makes `ready()` false, so the tools stop being admitted on any route until
the user picks another provider or signs in again; the other mounted providers
(`deepseek-search-api`, `http` fetch, Messages search) stay selectable.

### 3. Type and seam changes (all additive)

- `LlmConfigurableProvider.accountManaged?: boolean` — provider whose credential
  is produced by account sign-in, not a stored key reference; threaded through
  `joinProviderDirectory` to the client row.
- `LlmConfigurableProvider.piiShielded?: boolean` — route anonymizes personal
  data at the endpoint; rendered as the "data anonymized automatically" badge.
- `SignInAttemptView.userCode?: string` — device-flow code; `SignInDialog` and
  the desktop welcome page render it beside the authorization link.
- `AccountWallet.currency`: `'CNY' | 'USD' | 'RUB'`; `AccountSection` maps
  `RUB → ₽` in both balance rows.
- `ModelCatalog` group `accountManaged?: boolean` (host joins the directory flag
  so pickers can sort without re-reading the directory).
- `AccountView.embeddedPages?: boolean` — whether the account supports the
  desktop's embedded native platform pages; absent means `true` (today's
  behavior), VEGA returns `false` so `openPlatformPage` is not injected and
  usage/top-up/quota/onboarding affordances take the existing external-link
  path that web already uses.
- `isRunningAccountTask(agent, providers)` takes the managed-provider id set
  (previously a single literal); `installAccountTaskCancellation(ctx)` resolves
  the set lazily per event from
  `ctx.get('llm')?.listConfigurableProviders()` filtered to `accountManaged`
  entries — no `DeepSeekAccount` contract change and no `modelProvider` member.
- `SessionEventMap` + `known-event-types.ts`: `web/vega-search-llm-request` and
  `web/vega-fetch-llm-request` payloads for the VEGA auxiliary calls (new event
  types, safe under same-version reader rules).

### 4. Host changes

- `session-controller.initializeDefaultModel`: pick the first `accountManaged`
  directory provider's first catalog model instead of hardcoding
  `'deepseek-account'`; the client's immediate call after `succeeded` is safe
  because `api-vega`'s `listModels` awaits the listing cache (§2) before
  answering.
- `hasProviderApiKey`: skip `accountManaged` entries (covers both impls).
- `buildModelCatalog`: stamp `accountManaged` on groups from the directory.
- `account-controller.hasRunningAccountTasks` and the cancellation listener
  resolve the managed-provider set from the `accountManaged` directory (§3).

### 5. Client changes

- `ui-settings-models/src/client/store.ts`: every `provider === 'deepseek-account'`
  predicate becomes `entry.accountManaged === true` (apiKeyEnv skip,
  `accountAvailable` via catalog groups, row filter, `providerUsable`); sort puts
  account-managed rows first, `deepseek-official` second.
- `ModelsSection.tsx`: `needsSetup`, the Edit-button suppression, and the
  "signed in" badge key off `accountManaged`; a `piiShielded` entry renders the
  anonymization badge. The `t('deepSeekAccount')` name override stays keyed to
  the literal provider — `API VEGA` arrives via `displayName`.
- `ui-model-selection/src/client/provider-order.ts`: sort `accountManaged`
  groups first, `deepseek-official` second.
- `ui-settings-account`: `SignInDialog` shows `attempt.userCode` with a new
  localized label; `AccountSection` renders `₽` for `RUB` (`formatBalance`
  accepts `'₽'`); the `openPlatformPage` injection is gated on
  `view?.embeddedPages !== false` so VEGA's usage/top-up/quota/onboarding
  entries open `links.usageUrl`/`links.topUpUrl` in the external browser, the
  same path web already takes; both welcome page and dialog copy keys gain
  translations in all eight dictionaries (en, zh, ja, es, fr, de, ru, pt).
- `apps/desktop/src/client/WelcomePage.tsx`: render `userCode` during
  `waiting-browser` next to the copy-link control.
- `ui-settings-web-search`: the provider switch gains the "API VEGA" choice
  (visible while the Host serves `web-vega`, disabled until signed in) with
  localized labels in all eight dictionaries.
- `apps/desktop/src/account-backend.ts`: pass `attempt.userCode` through the
  sanitized `accountView` projection — today it drops unknown fields, so the
  code would never reach the welcome renderer.
- The desktop auto-open keeps working unchanged: `main.ts` navigates the
  system browser to `authorizeUrl` (the `?theme=` query it appends is ignored
  by the VEGA device page); `getPlatformSession → null` means no embedded
  session is ever published, matching `embeddedPages: false`.

### 6. Composition

`packages/bundle/base/cordis.patch.yml`: replace
`deepseek-account / @deepseek-ai/dsh-deepseek-account-platform` with
`vega-account / @deepseek-ai/dsh-vega-account` (dropping the
`desktopPlatform` config) and `llm-deepseek-account /
@deepseek-ai/dsh-llm-deepseek-account` with `llm-vega-account /
@deepseek-ai/dsh-llm-vega-account`; mount `web-vega /
@deepseek-ai/dsh-web-vega` and set the `web` service config to
`searchProvider: 'vega'` / `fetchProvider: 'vega'`; add all three packages to
the consuming profiles' resolver manifests. `llm-deepseek`
(`deepseek-official`), `llm-pi-ai`, `web-search-deepseek`, `web-deepseek-api`,
and `web-fetch-http` stay mounted and untouched — the web providers remain
selectable alternatives in settings.

### 7. Tests

- `dsh-vega-account`: device-code happy path (code → pending → token → key →
  commit → `credential-stored`), `slow_down`, `authorization_pending` expiry →
  `expired`, `access_denied` → `failed`, cancel mid-poll, `NOT_COMMITTED` on
  key-mint failure, sign-out revoke with retries, `resolveToken`/`rejectToken`
  origin gating, `getProfile`/`getBalance` mapping; real-composition boot with a
  loopback fake VEGA server asserting the stored record and `AccountView`.
- `dsh-llm-vega-account`: OpenRouter parse (malformed rows skipped), profile
  materialization, `MISSING_CREDENTIAL` → empty `listModels`, header stamping
  (session id, gated anonymize), error translation (401→reject+expired, 402→quota,
  pii codes), discovery handler, directory flags; real-composition asserting
  `modelCatalog` serves the whitelist.
- `llm-pi-ai`: cover the new exports as part of the composition suite.
- `session-controller`: `initializeDefaultModel` on an account-managed provider,
  `hasProviderApiKey` skip.
- `dsh-web-vega`: `ready()` gating (route + token), auxiliary request shape
  (server-tool entries, Bearer, `X-Vega-Session`, redirect rejection), result/
  citation folding, logged event payloads, `model` fallback order; composition
  test asserting `web_search`/`web_fetch` serve on the `api-vega` route and
  disappear after sign-out.
- `ui-settings-web-search`: VEGA choice staging (selects both providers,
  disabled while signed out), locale keys.
- `ui-settings-models`/`ui-settings-account`/`apps/desktop`: account-managed row
  behavior, userCode rendering (including the `accountView` passthrough), `₽`
  formatting, `embeddedPages:false` → external links, locale keys.
- Snapshot pass after wiring: model catalog / picker output changes ride the
  existing recorded-session gates; `snapshots/sdk/account-provider-signout`
  mounts `dsh-llm-deepseek-account` and asserts `deepseek-account` events, so
  the fixture is re-recorded with the VEGA mount.

## Known regressions and accepted trade-offs

- **`web_search`/`web_fetch` move to VEGA server tools** (§2b): the model-facing
  tools survive, but results now come from `openrouter:*` server tools inside
  auxiliary VEGA calls — citation fidelity and engine choice live server-side;
  the DeepSeek Messages-search path no longer authenticates on the account
  route (the `deepseek-account` literal it checks is gone from active routes).
- **`dsh_session_log` upload**: `session-log-deepseek` is a DeepSeek endpoint
  integration; it simply stops on the `api-vega` route (accepted — it is
  DeepSeek-specific telemetry, not product behavior).
- **`modelOverrides`/static `models` Config on `llm-deepseek-account`** has no
  `api-vega` analogue — the listing is server-whitelisted; deployment narrowing
  can be added later through the same profile mechanism if needed.
- **Dormant packages stay in the repository** (`dsh-deepseek-account-platform`,
  `dsh-llm-deepseek-account`): `experimental/translator` imports `Config` from
  the latter, and keeping them preserves rollback — they are only unmounted
  from the product composition.
- **Empty whitelist**: an empty `/models` response removes the `api-vega` group
  from every picker (empty groups are dropped by `buildModelCatalog`) and makes
  `initializeDefaultModel` throw `provider-models-unavailable` — the same
  semantics a no-models account route has today.
- **RU-build warning on direct providers** (spec §8 "только api.vega.chat, с
  предупреждением") is out of scope: the user chose to keep all providers
  unchanged, so no warning banner is added in this change.

## Acceptance criteria

1. Sign in opens the VEGA device page with the `user_code` visible; after the
   user confirms, the dialog closes and the account reads signed in without a
   manual key step.
2. The credential store holds `sk-apivega-...`; the value appears in no UI,
   settings document, or log.
3. Settings → Models shows a protected **API VEGA** card — no Edit, no Delete —
   while signed in; Select model lists exactly what `GET /api/v1/models`
   returns for the app key.
4. Model requests hit `https://api.vega.chat/api/v1` with `Bearer` and a stable
   `X-Vega-Session`; 401 removes the local key and surfaces the existing
   sign-in guidance; sign-out revokes the key server-side.
5. Account shows VEGA email and RUB balance; desktop usage/top-up entries open
   api.vega.chat in the external browser.
6. `web_search`/`web_fetch` serve through VEGA server tools on the `api-vega`
   route by default after sign-in and can be switched in Settings → Web search;
   all other providers stay mounted and selectable.
7. The whole thing is exercised by real-composition boots and the recorded
   session snapshot pass, not only unit fakes.

## Open implementation details left to the builder

- Exact `/api/v1/account` field names — parse leniently
  (email/name/balance fallbacks) and assert in tests against the documented
  shape; adjust mapping if the live schema differs.
- Whether pi-ai's flattened `errorMessage` preserves the HTTP status and
  `{error:{code}}` body — verified against `node_modules` during
  implementation; if not, error detail propagation lands in `llm-pi-ai`.
- `verification_uri` vs `verification_uri_complete` precedence per the live
  response.
- Reasoning-effort mapping from `supported_parameters` — deferred to a follow-up.
- Whether `defaultBaseURL`/`nativeAuth` on the `api-vega` directory entry helps
  any existing surface — set if free, skip otherwise.

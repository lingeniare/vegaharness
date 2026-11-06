# VEGA Native File Input (PDF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the `api-vega` provider route send eligible PDF attachments to api.vega.chat as native OpenRouter `file` content parts, so models read documents in one request instead of multi-turn LibreOffice/image tool loops — but only while the PII shield (`anonymize`) is off.

**Architecture:** Today `LlmRuntime.adapterStream` unconditionally rewrites every `FileBlock` to handle text (`projectFilesToText`), so no provider ever sees file bytes. We add an adapter-owned capability seam (`LlmAdapter.nativeFileInput`) that returns a per-request policy; the runtime keeps eligible file blocks native only when the adapter offers a policy AND the block is a `.pdf` user-message file within the byte cap. `llm-pi-ai` serializes surviving file blocks through a new `FileContent` pi-ai content type emitted by the existing pnpm patch of `@earendil-works/pi-ai` as OpenAI `{"type":"file","file":{"file_data":...}}` parts. OpenRouter file `annotations` (which skip re-parsing) round-trip through the existing `replayState` envelope as an additive optional field. `VegaAdapter` returns no policy while `anonymize()` is true, which also strips annotations from the wire.

**Tech Stack:** TypeScript ESM, Cordis plugins, pnpm patchedDependencies (`@earendil-works/pi-ai@1.3.0`), vitest, schemastery config.

**Spec:** This document's Goal/Architecture sections are the spec (analysis performed in session 2026-11-06; key evidence: `projectFilesToText` unconditional at `packages/llm/llm/src/index.ts:1100`, `LISTED_MODALITIES = ['text','image']` at `packages/llm/llm-vega-account/src/listing.ts:6`, pi-ai `MODEL_INPUT_MODALITIES = ["text","image"]`, `PATCHES` precedent at `patches/@earendil-works__pi-ai@1.3.0.patch`, `X-Vega-Anonymize` gate at `packages/llm/llm-vega-account/src/adapter.ts:86`).

## Global Constraints

- **PII shield is absolute:** when `anonymize()` returns true, no `file` content part and no `annotations` field may appear on the wire — identical to today's text-handle behavior. When false, the feature is active.
- **Only `api-vega` opts in.** Every other adapter (`llm-deepseek`, generic `llm-pi-ai` profiles) keeps current behavior: `nativeFileInput` stays `undefined`, files always project to text.
- **pi-ai changes only via `pnpm patch`** — never edit `node_modules` directly; all dist changes live in `patches/@earendil-works__pi-ai@1.3.0.patch` (regenerate with `pnpm patch`/`pnpm patch-commit`, keep existing hunks).
- **No hardcoded tunables:** byte caps and enable flags are validated `Config`/profile fields, never constants (repo rule).
- **Fail loud:** a `.pdf`-named file whose bytes lack the `%PDF-` magic, or a file block reaching an adapter that cannot serialize it, throws a typed `LlmError` — never silently dropped or mangled into `image_url`.
- **Model-visible ⟺ logged:** file blocks and `replayState` annotations are already durable session facts; no new session event types. `replayState` stays lossless-JSON and additive-optional so old and new builds read each other's envelopes safely.
- **Acknowledge the persistence-type change** per `docs/cookbook/reviewing-persistence-type-changes.md` (replay envelope gains an optional `annotations` field).
- **Session format:** do NOT bump `SESSION_FORMAT_VERSION`; the additive optional field degrades safely both directions (verified in Task 4 tests).
- Repo conventions apply: ESM, `.ts` relative imports, `ctx.effect()` registrations, typed errors, no `as unknown`, tests describe behavior, package README + JSDoc updated in the same commit, Agent Note for the durable decision.
- Verification per change: focused vitest specs, then `pnpm run typecheck`; before completion `pnpm run build` (or `build:artifacts` + `build:check`) plus `pnpm run doc-sync` for doc changes.

## Review Focus

Inputs/failure modes the spec implies but no single task's tests fully pin — each gets a test in the owning task:

1. **Shield toggled mid-session** — file blocks and assistant annotations must flip wire behavior on the very next request in both directions (Task 5 tests).
2. **Non-PDF or oversized attachment on an enabled route** — must degrade to today's handle text per-block, never drop content or send an ineligible part (Tasks 2, 4).
3. **`.pdf` extension but non-PDF bytes** — loud typed error, not provider garbage (Task 4).
4. **Old session replayState (no `annotations`) read by new build, and vice versa** — both must produce valid requests (re-parse fallback is acceptable) (Task 4).
5. **413/oversized-request classification** — a near-cap PDF re-sent every turn can hit provider request limits; `classifyPiAiError` already maps 413→`INVALID_REQUEST`, pin that it does not retry-loop (Task 4 test).
6. **Session JSONL growth** — annotations embed parsed document text/images in durable `replayState`; confirm acceptable size for the byte cap chosen, and record the trade-off in the Agent Note (Task 6).

---

### Task 1: Spike — verify VEGA file-part wire behavior with a real key

**Files:**
- Create (scratch, not committed): `%TEMP%/vega-file-spike.mjs`

**Interfaces:**
- Consumes: `VEGA_API_KEY` env (user-provided; never committed), `https://api.vega.chat/api/v1/chat/completions`.
- Produces: written findings appended to this plan's "Spike findings" section at the bottom — they pin the annotation capture shape used in Tasks 3–4.

- [ ] **Step 1: Send one tiny PDF as a `file` part, non-streaming then streaming**

```js
// messages: [{role:'user', content:[
//   {type:'text', text:'What is the title of this document?'},
//   {type:'file', file:{filename:'spike.pdf', file_data:'data:application/pdf;base64,'+b64}},
// ]}], model: <cheap text model from /models>, stream: false then true
```

Record: HTTP status, whether `choices[0].message.annotations` appears, and for `stream:true` exactly where annotations surface (`delta.annotations` per chunk? a final chunk field? `message.annotations`?). Also record `usage` deltas.

- [ ] **Step 2: Replay annotations on a second turn**

Send turn 2 = [original user msg with file part, assistant msg `{role:'assistant', content:<answer>, annotations:<captured>}`, new user msg]. Verify the response succeeds and note whether parse was skipped (compare `usage.prompt_tokens` vs turn 1, and whether a second `annotations` array returns — dedupe by `file.hash` per OpenRouter docs).

- [ ] **Step 3: Test hash-only / minimal annotation replay**

Repeat Step 2 with `annotations` reduced to `{type:'file', file:{hash, name}}` (no `content`). If accepted → durable storage stays tiny; if rejected → full annotation content must persist in `replayState` (size trade-off goes to Review Focus #6).

- [ ] **Step 4: Probe Files API and limits (timeboxed)**

`POST /api/v1/files` with the same PDF (purpose `user_data` if required by OpenRouter spec); check whether `file_id` references skip re-parsing on turn 2, and note documented inline size limits. This informs the follow-up, not MVP scope.

- [ ] **Step 5: Record findings**

Append a "Spike findings" section to this file: accepted part shape, annotation wire location + streaming shape, minimal-replay verdict, engine/plugins observations, any VEGA-specific deviation from OpenRouter docs. If file parts are rejected outright, STOP — the rest of the plan is void; report to the user instead.

### Task 2: `dsh-llm` — native file dispatch seam

**Files:**
- Modify: `packages/llm/llm/src/types.ts:98-109` (FileBlock doc), `packages/llm/llm/src/index.ts` (LlmAdapter + adapterStream ~line 1068-1122)
- Modify: `packages/llm/llm/src/content.ts:186-209` (`projectFilesToText`)
- Test: `packages/llm/llm/tests/content.spec.ts`, adapter-stream spec covering `adapterStream` projection (locate existing runtime spec first)

**Interfaces:**
- Produces:
  - `export interface LlmNativeFilePolicy { readonly maxFileBytes: number }` (declare beside `LlmAdapter` in `index.ts` or `types.ts` — match where `LlmImageRequestPricing` lives).
  - `LlmAdapter.nativeFileInput?(provider: string, model: string): LlmNativeFilePolicy | undefined` — default `undefined` (no override needed; document on the base method like `imageRequestPricing`).
  - `projectFilesToText(messages, resolvePath, keepNative?)` — new optional third param `keepNative?: (message: RequestMessage, block: FileBlock) => boolean`; blocks where it returns true pass through unchanged.
  - `export function nativeFileEligible(message: RequestMessage, block: FileBlock, policy: LlmNativeFilePolicy): boolean` in `content.ts` — true iff `message.role === 'user'`, `block.attachment.name` ends `.pdf` (case-insensitive), `block.attachment.bytes <= policy.maxFileBytes`.

- [ ] **Step 1: Failing tests**

In `content.spec.ts`: `nativeFileEligible` truth table (user+pdf+under-cap → true; tool-role, `.docx`, over-cap, missing name → false). `projectFilesToText` with `keepNative`: eligible block survives as `FileBlock`, ineligible sibling still becomes handle text, `resolvePath` not called for kept blocks.

In the runtime spec: an adapter stub returning `{maxFileBytes: N}` from `nativeFileInput` → dispatched `options.messages` retain the eligible `FileBlock`; stub returning `undefined` → all files become handle text (today's behavior pinned).

- [ ] **Step 2: Run tests, verify fail**

Run: `pnpm vitest run packages/llm/llm/tests/content.spec.ts` (plus the runtime spec path found in Step 1). Expected: FAIL — `nativeFileEligible`/`nativeFileInput` not defined.

- [ ] **Step 3: Implement**

`content.ts`: add `nativeFileEligible`; extend `projectFilesToText`/`replaceFilesWithHandles` with the optional predicate (default keeps current all-project behavior). `index.ts`: add `LlmNativeFilePolicy`, `LlmAdapter.nativeFileInput?` (JSDoc: synchronous, per-request, `undefined` = route never receives file blocks natively), and in `adapterStream` compute `const filePolicy = registration.adapter.nativeFileInput?.(options.provider, options.model)` before the file projection, passing `filePolicy === undefined ? undefined : (m, b) => nativeFileEligible(m, b, filePolicy)` as `keepNative`. Update the `FileBlock` doc in `types.ts` — files reach providers natively only on routes whose adapter declares a policy.

- [ ] **Step 4: Run tests, verify pass** + `pnpm run typecheck`

- [ ] **Step 5: Commit** — `feat(llm): add adapter-owned native file dispatch seam`

### Task 3: pi-ai patch — `FileContent` parts and message annotations

**Files:**
- Modify: `patches/@earendil-works__pi-ai@1.3.0.patch` (regenerate via `pnpm patch @earendil-works/pi-ai@1.3.0` → edit → `pnpm patch-commit`)
- Test: exercised through `packages/llm/llm-pi-ai/tests/*` in Task 4 (patch itself has no repo-local spec)

**Interfaces:**
- Produces (inside patched pi-ai):
  - `FileContent` content type: `{ type: 'file'; data: string /*base64*/; mimeType: string; name?: string }`, admitted into the user-message content union wherever `TextContent | ImageContent` appears.
  - `AssistantMessage.annotations?: unknown[]`.
  - `convertMessages` (openai-completions): `item.type === 'file'` → `{ type: 'file', file: { filename: item.name ?? 'file', file_data: 'data:' + item.mimeType + ';base64,' + item.data } }`; assistant params gain `annotations: msg.annotations` when present.
  - Stream parser (openai-completions): accumulate response file annotations onto the terminal `AssistantMessage.annotations` — exact capture point per Task 1 spike findings (expected `delta.annotations` accumulation, deduped by `file.hash`).

- [ ] **Step 1: `pnpm patch @earendil-works/pi-ai@1.3.0`, locate edit points**

Find: the content-block type declarations (`TextContent`/`ImageContent`/message content unions — likely `dist/types.d.ts` or a messages module), `AssistantMessage` declaration, the user-content `.map` inside `convertMessages` (~line 940 of `dist/api/openai-completions.js`), the assistant-message assembly (~line 960+), and the SSE delta handler that builds `output`/`message`.

- [ ] **Step 2: Edit `.d.ts` faces** — add `FileContent`, union membership, `AssistantMessage.annotations?: unknown[]`.

- [ ] **Step 3: Edit `openai-completions.js`** — the three runtime changes above, matching surrounding code style (the file is compiled JS; mirror existing patterns like `sanitizeSurrogates` usage where text is involved — annotation content passes through verbatim).

- [ ] **Step 4: `pnpm patch-commit`** → verify `patches/@earendil-works__pi-ai@1.3.0.patch` contains old hunks + new ones; `pnpm install` to apply.

- [ ] **Step 5: Smoke** — `pnpm vitest run packages/llm/llm-pi-ai` still green (existing specs must not regress; wire changes are additive).

- [ ] **Step 6: Commit** — `feat(llm-pi-ai): patch pi-ai for OpenRouter file parts and annotations`

### Task 4: `dsh-llm-pi-ai` — file serialization, annotation replay, profile flag

**Files:**
- Modify: `packages/llm/llm-pi-ai/src/config.ts` (PiAiProviderProfile ~line 105-208, Resolved ~211-239, schema ~line 374+, resolveProfiles ~line 468+)
- Modify: `packages/llm/llm-pi-ai/src/context.ts` (userContent ~67-98, toPiContext signatures ~315-401, appendAssistant/appendSharedHistory ~203-246)
- Modify: `packages/llm/llm-pi-ai/src/replay.ts` (toPiReplayState ~77-110, readReplayState ~117-149, replayedAssistant ~187-232)
- Modify: `packages/llm/llm-pi-ai/src/adapter.ts` (PiAiAdapterOptions ~86-129, stream ~400-499)
- Test: `packages/llm/llm-pi-ai/tests/context.spec.ts`, `tests/replay*.spec.ts` (locate), adapter spec for `nativeFileInput`

**Interfaces:**
- Consumes: Task 2's `LlmNativeFilePolicy`; Task 3's pi-ai `FileContent`/`AssistantMessage.annotations`.
- Produces:
  - `PiAiProviderProfile.nativeFileMaxBytes?: number` — presence enables native file dispatch for the whole route; absent disables. `ResolvedPiAiProviderProfile.nativeFileMaxBytes?: number` (optional, no default — absence is meaningful).
  - `PiAiAdapterOptions.resolveFilePath?: (attachments: AttachmentStore, ref: FileAttachmentRef) => string | undefined` — mirrors `resolveImageAccess` for handle text.
  - `PiAiAdapter.nativeFileInput(provider, model)` override → `profile.nativeFileMaxBytes === undefined ? undefined : { maxFileBytes: profile.nativeFileMaxBytes }`.
  - `toPiContext` media param widened: `PiMediaRequestContext extends PiImageRequestContext { files?: { maxFileBytes: number }; resolveFilePath?: (ref: FileAttachmentRef) => string | undefined }` (param type widens; `files` presence also gates annotation replay; `resolveFilePath` is bound per-request exactly like `resolveImageAccess`).
  - `toPiAssistant(message, onDegrade?, includeAnnotations = true)` — third optional param; `false` strips annotations from the rebuilt pi-ai message.
  - `replay.ts`: `PiAiReplayResponse.annotations?: unknown[]` — written by `toPiReplayState` from `message.annotations`, read back by `readReplayState`/`replayedAssistant` (additive; envelope `version` stays `2`).

- [ ] **Step 1: Failing tests**

`context.spec.ts`: with `files` policy — a `.pdf` `FileBlock` in a user message becomes `{type:'file', data:<base64>, mimeType:'application/pdf', name}` PLUS the `fileHandleText` text block (path resolved via `resolveFilePath`). Any other `FileBlock` reaching `userContent` (non-`.pdf` name, wrong role) throws `LlmError` `UNSUPPORTED_CONTENT` — the runtime pre-filter makes this unreachable in production, so the throw is the backstop, pinned by test. `files` absent → same throw; `textOnlyContext` throws on any file block. `%PDF-` magic mismatch → typed `LlmError`. Assistant message with `annotations` in replayState → pi-ai message carries them when `files` set, stripped when absent.

`replay` spec: `toPiReplayState` round-trips `annotations`; `readReplayState` accepts envelopes with and without the field; provider/model mismatch still rejects.

Adapter spec: `nativeFileInput` returns policy iff profile sets `nativeFileMaxBytes`.

- [ ] **Step 2: Run tests, verify fail**

- [ ] **Step 3: Implement config** — `nativeFileMaxBytes` optional positive-int field through `PiAiProviderProfile` → schema (`z.number().step(1).min(1).optional()`) → `resolveProfiles` carry-through → `ResolvedPiAiProviderProfile`.

- [ ] **Step 4: Implement context.ts** — `PiMediaRequestContext`; `PiFileRequestPolicy` is just `{ maxFileBytes }` inlined; `userContent` gains `case 'file'`: read bytes via `attachments.readFileStream(ref)` (collect to `Buffer`, cap at `maxFileBytes`+1 defensively), verify `%PDF-` magic, emit handle text (`fileHandleText` from `dsh-llm` with `resolveFilePath`) then `FileContent`; non-PDF or policy-absent → `LlmError('UNSUPPORTED_CONTENT')`. Thread `files !== undefined` as `includeAnnotations` into `appendAssistant`→`toPiAssistant`. `textOnlyContext`: throw `UNSUPPORTED_CONTENT` when `contentHasFile`.

- [ ] **Step 5: Implement replay.ts + adapter.ts** — annotations field plumbing; `nativeFileInput` override reading `this.config.profiles().get(provider)?.nativeFileMaxBytes`; in `stream`, compute `const filePolicy = this.nativeFileInput(options.provider, options.model)` once. The attachments/media-context branch condition becomes `containsImage || containsFile` (`contentHasFile` import added) so a files-only request still reaches `toPiContextWithImages`; inside that context pass `files: filePolicy === undefined ? undefined : { maxFileBytes: filePolicy.maxFileBytes }` and `resolveFilePath: ref => this.config.resolveFilePath?.(attachments, ref)`. A file block arriving while `files` is undefined throws `UNSUPPORTED_CONTENT` in `userContent` — the loud-failure backstop for the shield race.

- [ ] **Step 6: Run tests, verify pass** + `pnpm run typecheck`

- [ ] **Step 7: Commit** — `feat(llm-pi-ai): serialize native PDF file parts and replay file annotations`

### Task 5: `dsh-llm-vega-account` — enable route, gate on PII shield

**Files:**
- Modify: `packages/llm/llm-vega-account/src/config.ts`, `src/index.ts`, `src/adapter.ts`
- Test: `packages/llm/llm-vega-account/tests/*` (locate existing specs; add shield on/off cases)

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces:
  - `Config.nativeFiles: Volatile<boolean>` default `true` — deployment kill-switch for the whole feature.
  - `Config.nativeFileMaxBytes: Volatile<number>` default `10 * 1024 * 1024` (10 MiB; revisit after Task 1 findings — every turn re-sends base64, so stay conservative).
  - `profileSpec()` adds `nativeFileMaxBytes` only when `nativeFiles.get()` is true.
  - `VegaAdapter.nativeFileInput(provider, model)` → `this.vega.anonymize() ? undefined : super.nativeFileInput(provider, model)`.
  - `index.ts` wires `resolveFilePath` into `PiAiAdapterOptions`: `attachments.fileHostPath(ref)` → `ctx.get('fs')?.processPathFromHostPath(hostPath)` (mirror the `resolveImageAccess` wiring at `index.ts:110-114`).

- [ ] **Step 1: Failing tests**

Adapter/config specs: `nativeFiles=false` → profile lacks `nativeFileMaxBytes` → `nativeFileInput` undefined. `anonymize=true` → `nativeFileInput` undefined even with profile set; `anonymize=false` → `{maxFileBytes: configured}`. `resolveFilePath` returns process path / undefined gracefully.

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Implement** config fields + schema + volatile wiring; profileSpec conditional; adapter override; index.ts `resolveFilePath`.

- [ ] **Step 4: Run, verify pass** + `pnpm run typecheck`

- [ ] **Step 5: Commit** — `feat(llm-vega-account): native PDF input gated by PII shield state`

### Task 6: Docs, persistence acknowledgement, gates, Agent Note

**Files:**
- Modify: `packages/llm/llm/README.md`, `packages/llm/llm-pi-ai/README.md`, `packages/llm/llm-vega-account/README.md` (Model Experience format per `docs/cookbook/adding-a-package.md`)
- Modify: `docs/config-catalog.md` (regenerate via repo script — find it under `scripts/`)
- Create: `.agents/notes/implemented/architecture/2026-11-06-vega-native-file-input.md` (decision rationale: seam shape, shield gate, annotations-in-replayState, size-cap trade-off, Files API/engine follow-ups)
- Acknowledge persistence-type change per `docs/cookbook/reviewing-persistence-type-changes.md`

- [ ] **Step 1: Verify SDK expected outputs unaffected** — grep `packages/sdk` tests/expected for `replayState`; `SessionEventMap` unchanged so TS/Python SDK projections should not move; document the check result in the commit/PR.

- [ ] **Step 2: Snapshot/e2e coverage decision** — per `docs/testing.md`: model-visible change requires keyless recorded-session snapshot coverage where the harness supports it; `api-vega` needs account auth so likely covered by Task 1 spike + unit/REAL-composition specs instead — record the reasoning. Check whether `llm-vega-account` needs a REAL-composition cordis.yml test per `packages/AGENTS.md` and add if required.

- [ ] **Step 3: Write docs + Agent Note + persistence acknowledgement**

- [ ] **Step 4: Run gates** — `pnpm run doc-sync`, `pnpm run lint` on touched packages, `pnpm run build` (build:artifacts + build:check).

- [ ] **Step 5: Commit** — `docs(llm): native file input for api-vega`

## Spike findings

<!-- Task 1 appends verified wire behavior here before Tasks 3–4 rely on it. -->

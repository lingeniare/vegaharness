---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-10-31-vega-web-request-events

## Summary

Adds root events web/vega-search-llm-request and web/vega-fetch-llm-request, which log secret-free VEGA retrieval request metadata before each auxiliary search or fetch dispatch.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-10-31-vega-web-request-events
baseline: false
changes:
  - root: "event:web/vega-fetch-llm-request"
    previous: null
    after: "72360a4817d81e78bf128a8674ff57de1e12d53c30c8eaa1ff7debfbbad57090"
    decision: same-version
  - root: "event:web/vega-search-llm-request"
    previous: null
    after: "ba5cc8863f2730e657a8853b0c8654f0a13f94478596ffc8cab93b16e499ece6"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

Existing records remain valid: readers that predate these event types ignore unknown roots, and readers at this version log and render them. No discriminator, required field, or Session format version changes, so the same-version decision applies.

<a id="verification"></a>
## Verification

Focused web-vega tests: pnpm exec vitest run packages/web/web-vega — 5 tests passed.

<a id="dev-note"></a>
## Dev Note

None.

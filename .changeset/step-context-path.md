---
"@stackflow/core": minor
"@stackflow/plugin-history-sync": patch
---

Add optional `stepContext.path?: string` to `StepPushedEvent` and `StepReplacedEvent` (purely additive, no breaking change). `@stackflow/plugin-history-sync` uses this to preserve `encode`-output URLs through the store across every step navigation path — including `popstate` forward across step boundaries — instead of relying on plugin-internal state.

This addresses three regressions surfaced in PR review:

1. **`encode` output not in `history.location`** — post-effect hooks (`onPushed` / `onReplaced` / `onStepPushed` / `onStepReplaced` / `onInit`) called `template.fillWithoutEncode(activity.params)` against the post-coercion strings, skipping `encode` and writing coerced values into the URL. Now they read the encoded URL pre-computed in pre-effect hooks (`activityContext.path` / `stepContext.path`), with `fillWithoutEncode` as a defensive fallback only.
2. **`encode` called with coerced strings on popstate forward re-push** — the popstate `isForward` and `isStepForward` branches reconstructed push events without preserving `activityContext` / `stepContext`, causing `onBeforePush` / `onBeforeStepPush` to call `template.fill` with already-coerced strings. Now those branches pass `activityContext: targetActivity.context` / `stepContext: targetStep.context`, and the pre-effect hooks short-circuit when the path is already present (`"path" in actionParams.activityContext`).
3. **Test gap: `path(history.location)` was never asserted under non-identity `encode`** — every existing test asserted `activity.context.path` only. Added 15 new tests asserting the URL surface under non-identity encode, including popstate-forward across activity AND step boundaries, `defaultHistory` ancestor URLs, SSR replay, and `replace`-with-active-steps.

# Activity params runtime contract — design intent (FEP-1061)

This document captures the **chosen interpretation** and **boundary decision** for activity / step params runtime types in `@stackflow/plugin-history-sync`. It exists because the originating Linear ticket title and its supporting Slack quote pointed in opposite directions; this file pins the direction the implementation took and the rationale.

## Chosen interpretation

**Always-string at the plugin boundary.** `useActivityParams<K>()` returns `Record<string, string | undefined>` regardless of how an activity is entered — `push` / `replace` / `stepPush` / `stepReplace` / URL arrival with or without `decode` / cross-deploy `historyState` hydration.

This implements the request in [Yena (예나)'s Slack message](https://daangn.slack.com/archives/CGDR2PPM2/p1681885566763789) attached to [Linear FEP-1061](https://linear.app/daangn/issue/FEP-1061/activity-params-type-restriction-제거):

> "혹시 자동 형변환을 하는 이유가 있을까요? 그리고 자동형변환이 아닌 그냥 string으로 받아오는게 어떨지 건의드려요."

The Linear ticket's literal title — *"Activity params type restriction 제거"* (remove the type restriction) — points the *opposite* direction (widen the type to allow non-strings). This implementation **did not** take that direction; it instead enforces the existing `ActivityBaseParams = { [key: string]?: string }` declaration at runtime so the type and the runtime stop diverging.

## Boundary decision

**Coercion lives at the `@stackflow/plugin-history-sync` boundary, not in `@stackflow/core`.**

Concretely, `coerceParamsToString` runs inside the plugin's pre-effect hooks (`onBeforePush`, `onBeforeReplace`, `onBeforeStepPush`, `onBeforeStepReplace`) and inside `overrideInitialEvents` for the URL-arrival and cross-deploy hydration paths. `@stackflow/core` itself does not coerce.

### Tradeoff

A consumer that uses `@stackflow/core` *without* `historySyncPlugin` (e.g., programmatic-only navigation with no URL sync) does NOT receive the coercion. That consumer's store will contain whatever typed values they passed to `push()`. This is a documented tradeoff:

- **Pro:** keeps `@stackflow/core` framework-agnostic and free of plugin-specific concerns.
- **Pro:** consumers who don't need URL sync don't pay the coercion cost.
- **Con:** the FEP-1061 invariant is plugin-conditional, not core-universal. Consumers swapping `historySyncPlugin` for a different sync plugin must implement equivalent coercion.

### Why this tradeoff was chosen

1. `historySyncPlugin` is the only first-party plugin that serializes params to a string-shaped destination (URL). Without that destination, string-coercion has no architectural justification.
2. Moving coercion into `@stackflow/core` would make the core opinionated about a serialization concern that's strictly a plugin's responsibility.
3. The `ActivityBaseParams` type declaration (`{ [key: string]?: string }`) already pins consumer expectations at compile time; runtime coercion at the plugin boundary brings the runtime into alignment with the declared type, but the type itself remains the source of truth for non-history-sync consumers.

If a future ticket establishes that the FEP-1061 invariant should be a core-store contract instead, the implementation has to move into `@stackflow/core`'s reducer and the `coerceParamsToString` utility migrates with it.

## Risk #6 — plugin order matters

If a plugin registered AFTER `historySyncPlugin` in the plugins array calls `overrideActionParams` with typed values, those values bypass `historySyncPlugin`'s pre-effect coercion and land in the store as-is. This is locked as a regression test (`historySyncPlugin - FEP-1061: Risk #6`) so it cannot silently regress.

**Consumer guidance:** register `historySyncPlugin` last among plugins that mutate `activityParams`. The changeset for FEP-1061 documents this.

## Cross-deploy hydration (path 7)

`overrideInitialEvents`'s `parseState` early-return (`historySyncPlugin.tsx:198-225`) deserializes activity / step state previously written to `history.state`. If an old deploy wrote typed values, the new deploy's `coerceParamsToString` calls (added in commit `f9c317a5`) coerce them at hydration time. Idempotent on already-coerced strings.

## URL output contract — `history.location` reflects `encode` output

The runtime contract for `useActivityParams()` is "always string" (interpretation #3). The contract for `history.location` is **independent**: it must reflect `encode` output for routes with a custom `encode`, exactly as on `main`.

To uphold both contracts:

1. Pre-effect hooks (`onBeforePush` / `onBeforeReplace` / `onBeforeStepPush` / `onBeforeStepReplace`) compute the encoded URL via `template.fill(typed_params)` BEFORE coercion. Activities store this in `activityContext.path` (already in core); steps store it in `stepContext.path` (added in this PR cycle to `StepPushedEvent` / `StepReplacedEvent`).
2. Post-effect hooks (`onPushed` / `onReplaced` / `onStepPushed` / `onStepReplaced` / `onInit`) read `activity.context.path` and `step.context.path` directly. They never re-run `encode` on coerced strings.
3. The popstate `isForward` and `isStepForward` branches preserve `activityContext` / `stepContext` from the stored target, so the encoded URL is recovered without re-running `encode`.
4. If `*.context.path` is missing (e.g. a third-party plugin dispatched a `Pushed` event without going through `onBeforePush`, or a pre-Option-B `history.state` was hydrated from an older deploy), post-effect hooks fall back to `template.fillWithoutEncode(coerced_params)` — same lossy behavior as before this PR cycle, but only on those bypass paths.

### SSR consideration

When the server emits `activity.context.path` (e.g. via `initialContext.req.path` flowing through `historyEntryToEvents`), the client's `onInit` URL-replay trusts the server-emitted path rather than recomputing. This avoids encode-version mismatches between server and client builds. If you upgrade `encode` for a route, redeploy server and client together.

### Pre-Option-B legacy `history.state`

Entries serialized into `history.state` before this PR cycle have no `step.context.path`. On URL-arrival into such state, `onBeforeStepPush` runs the recompute branch — which requires the parent activity to be present in the stack. During initial boot, the parent might not be materialized yet, so recompute is skipped and post-effect falls back to `fillWithoutEncode(coerced)`. Acceptable as a transitional state across one deploy boundary; subsequent navigations populate `stepContext.path` correctly.

## Linear ticket interpretation block (test-surface)

A `describe.skip` block in `historySyncPlugin.spec.ts` named *"Linear ticket interpretation #1 — type widening (NOT chosen)"* contains executable assertions that would PASS only if `ActivityBaseParams` were widened. Those assertions are intentionally skipped; if the FE-core team decides to flip direction, that block is the unskip-and-implement guide.

## Decision record

- **Decision:** chosen interpretation = Yena's Slack request (always-string at plugin boundary), NOT the Linear ticket title (widen the type).
- **Drivers:** Yena's quote is the originating user pain; type-widening would force every consumer to handle non-string runtime types at the usage site.
- **Alternatives considered:** (a) widen `ActivityBaseParams` to `unknown`; (b) move coercion into `@stackflow/core`. Both rejected — see "Boundary decision" tradeoff above.
- **Why chosen:** keeps the type contract stable, fixes the runtime divergence at the plugin layer that owns the URL-serialization concern.
- **Consequences:** programmatic-only consumers (no `historySyncPlugin`) keep typed values in store; FEP-1061 invariant is plugin-conditional. Documented for future maintainers.
- **Follow-ups:** if FE-core team prefers direction (a) or (b), a new ticket tracks that work; this implementation does not pre-empt it.

## Links

- [Linear FEP-1061](https://linear.app/daangn/issue/FEP-1061/activity-params-type-restriction-제거)
- [Yena's Slack message](https://daangn.slack.com/archives/CGDR2PPM2/p1681885566763789)
- [Draft PR #705](https://github.com/daangn/stackflow/pull/705)
- [Changeset](../../.changeset/fep-1061-coerce-activity-params.md)

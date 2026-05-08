# Activity params runtime contract — design intent

This document captures the **chosen interpretation** and **boundary decision** for activity / step params runtime types in `@stackflow/plugin-history-sync`. It exists to record why the runtime contract was tightened to "always string" rather than widened to allow arbitrary types.

## Chosen interpretation

**Always-string at the plugin boundary.** `useActivityParams<K>()` returns `Record<string, string | undefined>` regardless of how an activity is entered — `push` / `replace` / `stepPush` / `stepReplace` / URL arrival with or without `decode` / cross-deploy `historyState` hydration.

The originating user request was not "let me pass typed values into the store" but rather "stop the auto-typecast that makes `useActivityParams` return a different runtime type depending on entry path". Internal navigation (`push({ visible: true })`) used to leave a boolean in the store while URL-arrival parsed the same value as `"true"`. Consumers were string-converting params before every push as a workaround.

This implementation does **not** widen `ActivityBaseParams = { [key: string]?: string }`; it enforces that declaration at runtime so the type and the runtime stop diverging.

## Boundary decision

**Coercion lives at the `@stackflow/plugin-history-sync` boundary, not in `@stackflow/core`.**

Concretely, `coerceParamsToString` runs inside the plugin's pre-effect hooks (`onBeforePush`, `onBeforeReplace`, `onBeforeStepPush`, `onBeforeStepReplace`) and inside `overrideInitialEvents` for the URL-arrival and cross-deploy hydration paths. `@stackflow/core` itself does not coerce.

### Tradeoff

A consumer that uses `@stackflow/core` *without* `historySyncPlugin` (e.g., programmatic-only navigation with no URL sync) does NOT receive the coercion. That consumer's store will contain whatever typed values they passed to `push()`. This is a documented tradeoff:

- **Pro:** keeps `@stackflow/core` framework-agnostic and free of plugin-specific concerns.
- **Pro:** consumers who don't need URL sync don't pay the coercion cost.
- **Con:** the invariant is plugin-conditional, not core-universal. Consumers swapping `historySyncPlugin` for a different sync plugin must implement equivalent coercion.

### Why this tradeoff was chosen

1. `historySyncPlugin` is the only first-party plugin that serializes params to a string-shaped destination (URL). Without that destination, string-coercion has no architectural justification.
2. Moving coercion into `@stackflow/core` would make the core opinionated about a serialization concern that's strictly a plugin's responsibility.
3. The `ActivityBaseParams` type declaration (`{ [key: string]?: string }`) already pins consumer expectations at compile time; runtime coercion at the plugin boundary brings the runtime into alignment with the declared type, but the type itself remains the source of truth for non-history-sync consumers.

If a future requirement establishes that the invariant should be a core-store contract instead, the implementation has to move into `@stackflow/core`'s reducer and the `coerceParamsToString` utility migrates with it.

## Plugin order matters (documented limitation)

If a plugin registered AFTER `historySyncPlugin` in the plugins array calls `overrideActionParams` with typed values, those values bypass `historySyncPlugin`'s pre-effect coercion and land in the store as-is. This is locked as a regression test so it cannot silently regress.

**Consumer guidance:** register `historySyncPlugin` last among plugins that mutate `activityParams`. The changeset for this work documents this.

## Cross-deploy hydration

`overrideInitialEvents`'s `parseState` early-return deserializes activity / step state previously written to `history.state`. If an old deploy wrote typed values, the new deploy's `coerceParamsToString` calls coerce them at hydration time. Idempotent on already-coerced strings.

## URL output contract — `history.location` reflects `encode` output

The runtime contract for `useActivityParams()` is "always string". The contract for `history.location` is **independent**: it reflects `encode` output for routes with a custom `encode`.

To uphold both contracts:

1. Pre-effect hooks (`onBeforePush` / `onBeforeReplace` / `onBeforeStepPush` / `onBeforeStepReplace`) compute the encoded URL via `template.fill(typed_params)` BEFORE coercion. Activities store this in `activityContext.path` (already in core); steps store it in `stepContext.path`.
2. Post-effect hooks (`onPushed` / `onReplaced` / `onStepPushed` / `onStepReplaced` / `onInit`) read `activity.context.path` and `step.context.path` directly. They never re-run `encode` on coerced strings.
3. The popstate `isForward` and `isStepForward` branches preserve `activityContext` / `stepContext` from the stored target, so the encoded URL is recovered without re-running `encode`.
4. If `*.context.path` is missing (e.g. a third-party plugin dispatched a `Pushed` event without going through `onBeforePush`, or a pre-update `history.state` was hydrated from an older deploy), post-effect hooks fall back to `template.fillWithoutEncode(coerced_params)` — same lossy behavior as before this change, but only on those bypass paths.

### SSR consideration

When the server emits `activity.context.path` (e.g. via `initialContext.req.path` flowing through `historyEntryToEvents`), the client's `onInit` URL-replay trusts the server-emitted path rather than recomputing. This avoids encode-version mismatches between server and client builds. If you upgrade `encode` for a route, redeploy server and client together.

### Cross-deploy hydration legacy fallback

Entries serialized into `history.state` before `stepContext.path` landed on core events have no `step.context.path`. On URL-arrival into such state, `onBeforeStepPush` runs the recompute branch — which requires the parent activity to be present in the stack. During initial boot, the parent might not be materialized yet, so recompute is skipped and post-effect falls back to `fillWithoutEncode(coerced)`. Acceptable as a transitional state across one deploy boundary; subsequent navigations populate `stepContext.path` correctly.

## Decision record

- **Decision:** runtime contract is "always-string at the plugin boundary"; the underlying type declaration is unchanged.
- **Drivers:** the originating user complaint was about runtime type divergence between in-process navigation and URL arrival, not about wanting typed values in the store. Type-widening would force every consumer to handle non-string runtime types at the usage site.
- **Alternatives considered:** (a) widen `ActivityBaseParams` to `unknown`; (b) move coercion into `@stackflow/core`. Both rejected — see "Boundary decision" tradeoff above.
- **Why chosen:** keeps the type contract stable, fixes the runtime divergence at the plugin layer that owns the URL-serialization concern.
- **Consequences:** programmatic-only consumers (no `historySyncPlugin`) keep typed values in store; the invariant is plugin-conditional. Documented for future maintainers.
- **Follow-ups:** if a future requirement prefers direction (a) or (b), a new ticket should track that work; this implementation does not pre-empt it.

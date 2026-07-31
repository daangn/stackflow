# @stackflow/core

## 3.1.0

### Minor Changes

- 8ce8866: Expose the live, action-local `actions.isPrevented()` state to every pre-effect hook.

### Patch Changes

- 9535716: Fix `resume()` leaving a Stack paused when no navigation event was queued after `pause()`.

## 3.0.0

### Major Changes

- f0fc1fb: Distinguish how a stack is initialized — created fresh (`create`) or restored from a snapshot (`load`) — and add the surface a snapshot round-trip needs: `StackSnapshot`, `actions.captureSnapshot()`, the `provideSnapshot` / `onLoadError` plugin hooks, and `initInfo` on `onInit`. Runtime behavior is unchanged when no snapshot is provided; the breaks are type-level only — the `StackflowPluginHook` → `StackflowPluginInitHook` rename, plus new required members on `StackflowActions` and on the `onInit` / `overrideInitialEvents` hook signatures — hence the major.

  **Added**

  - `StackSnapshot` (with the `SnapshotEvent` / `NavigationEvent` unions) — a plain-data record of the events a stack recorded at runtime — plus `SnapshotLoadError`.
  - `actions.captureSnapshot()` to export that record, and the `provideSnapshot` / `onLoadError` plugin hooks to supply a snapshot at creation time and route a failed load.
  - `initInfo: { kind: "create" | "load" }` on `onInit`; `overrideInitialEvents` now runs on the load path too and receives the same `initInfo`.

  **Changed**

  - Renamed the `StackflowPluginHook` type to `StackflowPluginInitHook`.
  - `StackflowActions` now requires `captureSnapshot`, the `onInit` / `overrideInitialEvents` hook arguments now require `initInfo`, and `overrideInitialEvents`' parameter widens from `(PushedEvent | StepPushedEvent)[]` to `SnapshotEvent[]` — hand-written mocks and wrap-and-forward plugins must adopt these.
  - `validateEvents` now also rejects a `Replaced` that names an unregistered activity (does not fire in config-first usage).

## 2.0.1

### Patch Changes

- 416b65d: Remove the internal optional `stepContext` event fields and `ActivityStep.context`
  storage that were added for plugin-history-sync URL preservation.

## 2.0.0

### Major Changes

- 273d45f: Major version bump for ecosystem alignment. No API changes.

### Minor Changes

- cef9c62: Add optional `stepContext.path?: string` to `StepPushedEvent` and `StepReplacedEvent` (purely additive, no breaking change). `@stackflow/plugin-history-sync` uses this to preserve `encode`-output URLs through the store across every step navigation path — including `popstate` forward across step boundaries — instead of relying on plugin-internal state.

  This addresses three regressions surfaced in PR review:

  1. **`encode` output not in `history.location`** — post-effect hooks (`onPushed` / `onReplaced` / `onStepPushed` / `onStepReplaced` / `onInit`) called `template.fillWithoutEncode(activity.params)` against the post-coercion strings, skipping `encode` and writing coerced values into the URL. Now they read the encoded URL pre-computed in pre-effect hooks (`activityContext.path` / `stepContext.path`), with `fillWithoutEncode` as a defensive fallback only.
  2. **`encode` called with coerced strings on popstate forward re-push** — the popstate `isForward` and `isStepForward` branches reconstructed push events without preserving `activityContext` / `stepContext`, causing `onBeforePush` / `onBeforeStepPush` to call `template.fill` with already-coerced strings. Now those branches pass `activityContext: targetActivity.context` / `stepContext: targetStep.context`, and the pre-effect hooks short-circuit when the path is already present (`"path" in actionParams.activityContext`).
  3. **Test gap: `path(history.location)` was never asserted under non-identity `encode`** — every existing test asserted `activity.context.path` only. Added 15 new tests asserting the URL surface under non-identity encode, including popstate-forward across activity AND step boundaries, `defaultHistory` ancestor URLs, SSR replay, and `replace`-with-active-steps.

## 1.3.2

### Patch Changes

- 0160f82: Fix intermittent incorrect transition state when `transitionDuration` is set to 0 by ensuring `now >= eventDate` in the initial aggregate call within `dispatchEvent`.

## 1.3.1

### Patch Changes

- 4d3b294: fix(core): prevent duplicate setInterval in dispatchEvent

## 1.3.0

### Minor Changes

- 83ee5ed: Expose events used to build a stack via `Stack.events`

## 1.2.0

### Minor Changes

- cfa7af8: Supports dynamic import for activities, and delays transition effects while loading an activity or waiting for a loader response
- cfa7af8: feat(core, react): add `hasZIndex` option in `useStepFlow()`

## 1.1.1

### Patch Changes

- 5fc54cb: Made `divideBy` to be friendly to type inference.

## 1.1.0

### Minor Changes

- 667570b: feat(core,react): add `targetActivityId` option

## 1.1.0-canary.0

### Minor Changes

- feat(core,react): add `targetActivityId` option

## 1.0.14

### Patch Changes

- 96ff22d: fix: enable cyclic dependency and fix promise return in loader

## 1.0.13

### Patch Changes

- 3e35026: chore: include declaration map

## 1.0.12

### Patch Changes

- edfffda: use Biome for lint instead of ESLint and fix fixable errors

## 1.0.11

### Patch Changes

- 7df36f1b: accept only serializable parameters when making domain event

## 1.0.10

### Patch Changes

- a32a7e09: chore: bump patch version
- a32a7e09: fix(core)!: delegate overrideInitialEvents to makeCoreStore

## 1.0.10-canary.0

### Patch Changes

- fix(core)!: delegate overrideInitialEvents to makeCoreStore

## 1.0.9

### Patch Changes

- e4c49cdc: chore: apply new release system

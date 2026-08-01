# @stackflow/plugin-history-sync

## 2.0.0

### Major Changes

- f7c3a2b: Preserve snapshot navigation history during initialization instead of replacing it with events derived from the current URL. `@stackflow/core` v3 is now required so the plugin can distinguish snapshot loads from fresh stack creation.

### Minor Changes

- 78ea192: Support `preventDefault`: the browser history now follows the committed stack through a single reconciler, so `preventDefault`-based plugins (e.g. `@stackflow/plugin-blocker`) work with browser back/forward and programmatic navigation without history/stack desync.

### Patch Changes

- aaf2d03: Expand the supported `@stackflow/core` peer dependency range to include both v2 and v3.

## 1.12.0

### Minor Changes

- fd33557: Pass `initialContext` to route `defaultHistory` callbacks so the initial stack can depend on request-specific context.

### Patch Changes

- Updated dependencies [f0fc1fb]
  - @stackflow/core@3.0.0

## 1.11.2

### Patch Changes

- 416b65d: Withdraw the activity and step param string coercion introduced in `1.11.0`.
  Internal navigation now preserves non-string param values at runtime again, while
  URL arrivals continue to use decoded URL params as before.

## 1.11.1

### Patch Changes

- b7724e9: Fix an SSR hydration mismatch that occurred when an activity declared a non-empty `defaultHistory`.

  The staged `defaultHistory` setup navigation was kicked off synchronously inside the `onInit` hook, which runs during the first client render. As a result, the client's first render contained more activities than the server-rendered output, producing a React hydration mismatch.

  The setup navigation is now kicked off from a post-commit effect instead, so the server and the client's first render produce identical output (eliminating the mismatch) while the staged "stacking" setup animation still plays after hydration.

## 1.11.0

### Minor Changes

- cef9c62: Coerce activity/step params to `string | undefined` at the plugin boundary.

  Before this change, `push("X", { visible: true })` would store the boolean `true` in the core store while URL-arrival parsed the same URL as `{ visible: "true" }`, so `useActivityParams()` (with generic parameter `K`) returned different runtime types depending on how the user reached the activity. This PR coerces non-string values to strings inside `plugin-history-sync`'s `onBeforePush` / `onBeforeReplace` / `onBeforeStepPush` / `onBeforeStepReplace` hooks (after `encode` consumes the typed params to build the URL), and on the `decode`-path in `overrideInitialEvents`, so the core store always contains `{ [key: string]: string | undefined }`. `encode` still receives the typed params `U` from `template.fill`. Post-effect hooks (`onPushed`, `onReplaced`, `onStepPushed`, `onStepReplaced`, `onInit`) now use the new `fillWithoutEncode` to avoid re-running `encode` on already-coerced store values.

  This is a behavioral change for consumers that relied on internal push preserving non-string values in the store (a pre-existing divergence from URL-arrival behavior). See the docs update for the migration note.

  Migration notes:

  - If you authored a `decode` hook that returns typed values (e.g. `decode: (p) => ({ count: Number(p.count) })`), those return values are now coerced back to strings in the store to match the declared `ActivityBaseParams` contract. Move runtime type coercion to the usage site (`Number(useActivityParams().count)`).
  - If your app registers a plugin AFTER `historySyncPlugin` in the plugins array and that plugin re-injects typed values via `overrideActionParams`, those values will NOT be coerced by this plugin. Register `historySyncPlugin` last among plugins that mutate `activityParams` to preserve the string-only invariant.
  - Cross-deploy hydration: when a user reloads on a deploy that includes this fix after a previous deploy serialized typed values into `history.state`, the params are coerced to strings at hydration time inside the `parseState` early-return. No consumer change required — the post-fix runtime contract (`useActivityParams()` returns `string | undefined`) holds across version boundaries.

### Patch Changes

- cef9c62: Add optional `stepContext.path?: string` to `StepPushedEvent` and `StepReplacedEvent` (purely additive, no breaking change). `@stackflow/plugin-history-sync` uses this to preserve `encode`-output URLs through the store across every step navigation path — including `popstate` forward across step boundaries — instead of relying on plugin-internal state.

  This addresses three regressions surfaced in PR review:

  1. **`encode` output not in `history.location`** — post-effect hooks (`onPushed` / `onReplaced` / `onStepPushed` / `onStepReplaced` / `onInit`) called `template.fillWithoutEncode(activity.params)` against the post-coercion strings, skipping `encode` and writing coerced values into the URL. Now they read the encoded URL pre-computed in pre-effect hooks (`activityContext.path` / `stepContext.path`), with `fillWithoutEncode` as a defensive fallback only.
  2. **`encode` called with coerced strings on popstate forward re-push** — the popstate `isForward` and `isStepForward` branches reconstructed push events without preserving `activityContext` / `stepContext`, causing `onBeforePush` / `onBeforeStepPush` to call `template.fill` with already-coerced strings. Now those branches pass `activityContext: targetActivity.context` / `stepContext: targetStep.context`, and the pre-effect hooks short-circuit when the path is already present (`"path" in actionParams.activityContext`).
  3. **Test gap: `path(history.location)` was never asserted under non-identity `encode`** — every existing test asserted `activity.context.path` only. Added 15 new tests asserting the URL surface under non-identity encode, including popstate-forward across activity AND step boundaries, `defaultHistory` ancestor URLs, SSR replay, and `replace`-with-active-steps.

- Updated dependencies [273d45f]
- Updated dependencies [273d45f]
- Updated dependencies [cef9c62]
  - @stackflow/config@2.0.0
  - @stackflow/core@2.0.0
  - @stackflow/react@2.0.0

## 1.10.1

### Patch Changes

- 2c5786a: Fix `fallbackActivity` callback being invoked on every initialization regardless of route matching outcome. Restored the pre-1.8.0 contract: the callback is now called only when no route matches `currentPath`. Apps that perform side effects in this callback (e.g. Sentry logging for unknown deep links) no longer fire on successful matches.

## 1.10.0

### Minor Changes

- 45fb7ba: Add encode option to Route interface for converting activity params to URL string params

## 1.9.0

### Minor Changes

- a7d0c01: Add an option to skip default history setup transition

## 1.8.1

### Patch Changes

- 567352a: Fix SSR compatibility by adding getServerSnapshot parameter to useSyncExternalStore. This resolves the "Missing getServerSnapshot, which is required for server-rendered content" error in SSR environments.

## 1.8.0

### Minor Changes

- f298988: Add `defaultHistory` route option to pre-seed stack for better deep link experiences
- 83ee5ed: Expose stack initialization process status for users to disable logging or fetching while initialization transition

## 1.7.1

### Patch Changes

- e323ce3: fix: add `decode()` interface to `Config` and support `path: string[]`

## 1.7.0

### Minor Changes

- 7b1780f: feat: Support `<Link />` in Future API

### Patch Changes

- dc26742: fix(plugin-history-sync): replace json-cycle with flatted

## 1.6.4-canary.0

### Patch Changes

- fix(plugin-history-sync): replace json-cycle with flatted

## 1.6.3

### Patch Changes

- 31dc20f: fix(plugin-history-sync): serialize state before pushState, replaceState

## 1.6.2

## 1.6.2-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.3.0-canary.0
  - @stackflow/core@1.1.0-canary.0

## 1.6.1

### Patch Changes

- 96ff22d: fix: enable cyclic dependency and fix promise return in loader

## 1.6.0

### Minor Changes

- 7df613a: Future API
- e9bb029: feat(plugin-history-sync): sort routes by computed score
- 7df613a: Stackflow Config and Loader API (2.0 Candidate API with `/future` namespace)

## 1.6.0-canary.0

### Minor Changes

- Future API

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.2.0-canary.0
  - @stackflow/config@1.0.1-canary.0

## 1.5.4

### Patch Changes

- 3e35026: chore: include declaration map

## 1.5.3

### Patch Changes

- 7788fbc: change asterisk(`*`) priority to lowest

## 1.5.2

### Patch Changes

- edfffda: use Biome for lint instead of ESLint and fix fixable errors

## 1.5.1

### Patch Changes

- 7df36f1b: accept only serializable parameters when making domain event

## 1.5.0

### Minor Changes

- cea51375: Pass initial search params to fallback activity as an activity params

## 1.4.0

### Minor Changes

- 36613e35: Sort routes by variable count and refactor useRoutes(), normalizeRouteInput() function

### Patch Changes

- 6ad362f7: feat: add decode interface
- 6ad362f7: fix(plugin-history-sync): decode search params

## 1.4.0-canary.1

### Patch Changes

- fix(plugin-history-sync): decode search params

## 1.4.0-canary.0

### Minor Changes

- 36613e35: Sort routes by variable count and refactor useRoutes(), normalizeRouteInput() function

### Patch Changes

- feat: add decode interface
- Updated dependencies
  - @stackflow/react@1.1.8-canary.0

## 1.3.18

### Patch Changes

- a32a7e09: chore: bump patch version
- Updated dependencies [a32a7e09]
- Updated dependencies [a32a7e09]
  - @stackflow/react@1.1.7
  - @stackflow/core@1.0.10

## 1.3.18-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.1.7-canary.0
  - @stackflow/core@1.0.10-canary.0

## 1.3.17

### Patch Changes

- 99c34fa4: fix(plugin-history-sync): request history tick on init

## 1.3.16

### Patch Changes

- 45cf3f4d: fix(plugin-history-sync)!: reduce loop count for parsing state

## 1.3.15

### Patch Changes

- f3b2d720: fix(plugin-history-sync): fix history queue on init

## 1.3.14

### Patch Changes

- e4c49cdc: chore: apply new release system
- Updated dependencies [e4c49cdc]
  - @stackflow/core@1.0.9
  - @stackflow/react@1.1.6

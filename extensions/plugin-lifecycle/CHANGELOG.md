# @stackflow/plugin-lifecycle

## 0.1.0

### Minor Changes

- 39dbf81: Add lifecyclePlugin and useFocusEffect hook for activity focus/blur lifecycle

  - `useFocusEffect(callback)` hook to register per-activity focus/blur callbacks
  - Detection and invocation in plugin `onChanged` (outside React render cycle)
  - `callbackRef` pattern for always-latest callback without `useCallback`
  - Error isolation via `runSafely()` for all user callbacks

### Patch Changes

- fce2047: Add README documentation for plugin-lifecycle

---
"@stackflow/plugin-lifecycle": minor
---

Add lifecyclePlugin and useFocusEffect hook for activity focus/blur lifecycle

- `useFocusEffect(callback)` hook to register per-activity focus/blur callbacks
- Detection and invocation in plugin `onChanged` (outside React render cycle)
- `callbackRef` pattern for always-latest callback without `useCallback`
- Error isolation via `runSafely()` for all user callbacks

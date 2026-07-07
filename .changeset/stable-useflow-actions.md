---
"@stackflow/react": patch
---

Memoize the action functions returned by `useFlow` and `useStepFlow` so their references stay stable across renders.

Previously these hooks rebuilt their action object (`push`/`replace`/`pop`, `pushStep`/`replaceStep`/`popStep`) on every render, giving the returned functions a new reference each time. Since the underlying core actions are already a stable reference, the returned actions are now memoized on them (the same approach `usePrepare` already uses). This keeps the functions referentially stable when placed in `useEffect`/`useCallback` dependency arrays, avoiding unnecessary re-runs.

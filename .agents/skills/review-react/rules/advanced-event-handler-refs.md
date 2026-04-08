---
title: Store Event Handlers in Refs
impact: LOW
impactDescription: stable subscriptions
tags: advanced, hooks, refs, event-handlers, optimization
---

## Store Event Handlers in Refs

Store callbacks in refs when used in effects that shouldn't re-subscribe on callback changes.

**Incorrect (re-subscribes on every render):**

```tsx
function useWindowEvent(event: string, handler: (e) => void) {
  useEffect(() => {
    window.addEventListener(event, handler)
    return () => window.removeEventListener(event, handler)
  }, [event, handler])
}
```

**Correct (stable subscription):**

```tsx
function useWindowEvent(event: string, handler: (e) => void) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const listener = (e) => handlerRef.current(e)
    window.addEventListener(event, listener)
    return () => window.removeEventListener(event, listener)
  }, [event])
}
```

**Alternative: use `useEffectEvent` if you're on latest React:**

```tsx
import { useEffectEvent } from 'react'

function useWindowEvent(event: string, handler: (e) => void) {
  const onEvent = useEffectEvent(handler)

  useEffect(() => {
    window.addEventListener(event, onEvent)
    return () => window.removeEventListener(event, onEvent)
  }, [event])
}
```

`useEffectEvent` provides a cleaner API for the same pattern: it creates a stable function reference that always calls the latest version of the handler.

### When external code reads your ref: useEffect update is mandatory

The "Correct" pattern above (update ref in `useEffect`) is not just an optimization — it becomes a **correctness requirement** when code outside React reads the ref synchronously.

Examples of external readers:
- Store/state-manager subscribers (e.g., `store.subscribe()`, Zustand/Redux middleware)
- Event bus listeners (e.g., `EventEmitter.on()`)
- Framework lifecycle hooks that fire outside React's render cycle

If you update the ref during render instead of in useEffect, Concurrent Mode can abandon that render. The external reader then sees a callback from a render that never committed — a value that doesn't correspond to any real UI state.

**Rule of thumb:** If anything outside React's tree can call `ref.current`, the ref must only be written in `useEffect`. The one-render staleness between render and commit is the correct trade-off — a stale-but-committed callback is always safer than an uncommitted one.

See also: `react-rules-purity` Rule 6 for the full rationale and examples.

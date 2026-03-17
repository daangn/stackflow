---
title: Store Event Handlers in Refs for Stable Callbacks
impact: LOW
impactDescription: provides stable function identity without stale closures
tags: advanced, refs, event-handlers, useRef, stable-callback
---

## Store Event Handlers in Refs for Stable Callbacks

**Impact: LOW (provides stable function identity without stale closures)**

When you need a callback that always calls the latest version of a function without changing identity, store the handler in a ref. This avoids both stale closures and unnecessary re-renders from changing callback props.

**Incorrect (callback changes identity, causing child re-renders):**

```tsx
function Chat({ roomId }) {
  const [message, setMessage] = useState('')

  const handleSend = useCallback(() => {
    sendMessage(roomId, message)
  }, [roomId, message]) // Changes on every keystroke

  return <SendButton onClick={handleSend} />
}
```

**Correct (ref-based stable callback):**

```tsx
function Chat({ roomId }) {
  const [message, setMessage] = useState('')

  const handleSendRef = useRef(() => {})
  handleSendRef.current = () => {
    sendMessage(roomId, message)
  }

  const handleSend = useCallback(() => {
    handleSendRef.current()
  }, [])

  return <SendButton onClick={handleSend} />
}
```

This is the pattern behind `useEffectEvent` (experimental). When `useEffectEvent` stabilizes, prefer it over manual ref management.

Reference: [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)

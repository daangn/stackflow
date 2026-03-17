---
title: Defer State Reads to Usage Points
impact: MEDIUM
impactDescription: avoids re-renders from state changes only used in callbacks
tags: rerender, state-subscription, useRef, callbacks
---

## Defer State Reads to Usage Points

**Impact: MEDIUM (avoids re-renders from state changes only used in callbacks)**

If a state value is only consumed in event handlers (not in JSX), subscribing to it via `useState` causes unnecessary re-renders. Defer the read using a ref or by restructuring the component.

**Incorrect (subscribing to state only used in callback):**

```tsx
function Form() {
  const [draft, setDraft] = useState('')
  const [items, setItems] = useState<string[]>([])

  // `draft` is read only in this handler, but every keystroke re-renders
  const handleAdd = () => {
    setItems(prev => [...prev, draft])
    setDraft('')
  }

  return (
    <>
      <input value={draft} onChange={e => setDraft(e.target.value)} />
      <button onClick={handleAdd}>Add</button>
      <ItemList items={items} />
    </>
  )
}
```

**Correct (use ref for value only needed in callbacks):**

```tsx
function Form() {
  const draftRef = useRef('')
  const [items, setItems] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    setItems(prev => [...prev, draftRef.current])
    draftRef.current = ''
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <input ref={inputRef} onChange={e => { draftRef.current = e.target.value }} />
      <button onClick={handleAdd}>Add</button>
      <ItemList items={items} />
    </>
  )
}
```

Note: This pattern trades React's controlled input for an uncontrolled one. Only apply when the state truly isn't needed in the render output.

Reference: [useRef](https://react.dev/reference/react/useRef)

---
title: Move Interaction Logic from Effects to Event Handlers
impact: MEDIUM
impactDescription: eliminates unnecessary effect cycles and simplifies data flow
tags: rerender, useEffect, event-handlers, interaction
---

## Move Interaction Logic from Effects to Event Handlers

**Impact: MEDIUM (eliminates unnecessary effect cycles and simplifies data flow)**

Effects are for synchronizing with external systems, not for responding to user interactions. When logic should run in response to a specific user action, put it in the event handler.

**Incorrect (effect responding to state set by event):**

```tsx
function SearchPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (submitted) {
      fetchResults(query)
      setSubmitted(false)
    }
  }, [submitted, query])

  return (
    <form onSubmit={() => setSubmitted(true)}>
      <input value={query} onChange={e => setQuery(e.target.value)} />
    </form>
  )
}
```

**Correct (logic in event handler):**

```tsx
function SearchPage() {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    fetchResults(query)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={e => setQuery(e.target.value)} />
    </form>
  )
}
```

A useful heuristic: if the code runs because the user did something (click, submit, type), it belongs in an event handler. If it runs because something needs to stay in sync (data subscription, DOM measurement), it belongs in an effect.

Reference: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

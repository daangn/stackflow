---
title: Use startTransition for Non-Urgent Updates
impact: MEDIUM
impactDescription: keeps UI responsive during expensive state updates
tags: rerender, useTransition, startTransition, concurrent
---

## Use startTransition for Non-Urgent Updates

**Impact: MEDIUM (keeps UI responsive during expensive state updates)**

When a state update triggers expensive rendering (large lists, complex computations), wrapping it in `startTransition` tells React it can be interrupted by more urgent updates like typing.

**Incorrect (expensive update blocks input):**

```tsx
function FilterableList({ items }) {
  const [filter, setFilter] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value) // Expensive filter blocks typing
  }

  const filtered = items.filter(item => item.name.includes(filter))

  return (
    <>
      <input onChange={handleChange} />
      <List items={filtered} />
    </>
  )
}
```

**Correct (defer expensive update with transition):**

```tsx
function FilterableList({ items }) {
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value) // Urgent: update input immediately
    startTransition(() => {
      setFilter(e.target.value) // Non-urgent: can be interrupted
    })
  }

  const filtered = items.filter(item => item.name.includes(filter))

  return (
    <>
      <input value={input} onChange={handleChange} />
      <List items={filtered} />
    </>
  )
}
```

Reference: [startTransition](https://react.dev/reference/react/startTransition)

---
title: Extract Memoized Child Components
impact: MEDIUM
impactDescription: prevents expensive subtrees from re-rendering unnecessarily
tags: rerender, memo, React.memo, memoization
---

## Extract Memoized Child Components

**Impact: MEDIUM (prevents expensive subtrees from re-rendering unnecessarily)**

When a parent re-renders, all children re-render too. Extract expensive children into `React.memo()` components so they only re-render when their props actually change.

**Incorrect (expensive child re-renders on every parent update):**

```tsx
function Dashboard({ data, onRefresh }) {
  const [filter, setFilter] = useState('')

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <ExpensiveChart data={data} />
    </div>
  )
}
```

**Correct (wrap expensive child in memo):**

```tsx
const ExpensiveChart = memo(function ExpensiveChart({ data }: { data: Data }) {
  // Only re-renders when `data` changes
  return <canvas>{/* heavy rendering */}</canvas>
})

function Dashboard({ data }) {
  const [filter, setFilter] = useState('')

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <ExpensiveChart data={data} />
    </div>
  )
}
```

Only use `memo` when profiling shows the child is expensive. Premature memoization adds complexity without benefit.

Reference: [memo](https://react.dev/reference/react/memo)

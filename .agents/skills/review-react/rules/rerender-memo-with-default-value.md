---
title: Hoist Default Non-Primitive Props Outside Memo
impact: MEDIUM
impactDescription: prevents memo from being defeated by new object references
tags: rerender, memo, default-props, reference-identity
---

## Hoist Default Non-Primitive Props Outside Memo

**Impact: MEDIUM (prevents memo from being defeated by new object references)**

When a memoized component receives a default value like `{}` or `[]` inline, a new reference is created each render, defeating the memo.

**Incorrect (default value creates new reference each render):**

```tsx
const List = memo(function List({ items = [], config = {} }) {
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
})

function Parent() {
  // items and config will be new refs every render if undefined
  return <List />
}
```

**Correct (hoist defaults to module scope):**

```tsx
const EMPTY_ITEMS: Item[] = []
const DEFAULT_CONFIG: Config = {}

const List = memo(function List({
  items = EMPTY_ITEMS,
  config = DEFAULT_CONFIG,
}) {
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
})
```

This also applies to callback props. Use `useCallback` or hoist the function to module scope.

Reference: [memo](https://react.dev/reference/react/memo)

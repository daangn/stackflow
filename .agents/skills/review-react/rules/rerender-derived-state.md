---
title: Subscribe to Derived Booleans, Not Raw Objects
impact: MEDIUM
impactDescription: reduces re-renders by narrowing subscription scope
tags: rerender, derived-state, selectors, context
---

## Subscribe to Derived Booleans, Not Raw Objects

**Impact: MEDIUM (reduces re-renders by narrowing subscription scope)**

When a component only needs to know whether a condition is true (e.g., "is the list empty?"), subscribing to the full object causes re-renders whenever any part of the object changes. Derive a boolean or primitive and subscribe to that instead.

**Incorrect (subscribing to full array to check emptiness):**

```tsx
function EmptyBanner() {
  const items = useStore(state => state.items) // Re-renders on any item change
  if (items.length > 0) return null
  return <p>No items yet</p>
}
```

**Correct (subscribe to derived boolean):**

```tsx
function EmptyBanner() {
  const isEmpty = useStore(state => state.items.length === 0)
  if (!isEmpty) return null
  return <p>No items yet</p>
}
```

This pattern works with any external store, context selector, or state management library that supports selectors.

Reference: [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)

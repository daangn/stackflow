---
title: Use Primitive Values in Effect Dependencies
impact: MEDIUM
impactDescription: prevents effects from re-firing on every render due to new object references
tags: rerender, useEffect, dependencies, primitives
---

## Use Primitive Values in Effect Dependencies

**Impact: MEDIUM (prevents effects from re-firing on every render due to new object references)**

Object and array dependencies create new references each render, causing effects to re-run unnecessarily. Extract the primitive values you actually depend on.

**Incorrect (object in dependency array):**

```tsx
function UserProfile({ user }) {
  useEffect(() => {
    document.title = user.name
  }, [user]) // Fires every render if `user` is a new object
}
```

**Correct (primitive dependency):**

```tsx
function UserProfile({ user }) {
  useEffect(() => {
    document.title = user.name
  }, [user.name]) // Only fires when name actually changes
}
```

**Incorrect (derived object in dependency):**

```tsx
function Chart({ data }) {
  const config = { type: 'bar', data }

  useEffect(() => {
    renderChart(config)
  }, [config]) // New object every render
}
```

**Correct (memoize or use primitives):**

```tsx
function Chart({ data }) {
  useEffect(() => {
    renderChart({ type: 'bar', data })
  }, [data])
}
```

Reference: [Removing unnecessary dependencies](https://react.dev/learn/removing-effect-dependencies)

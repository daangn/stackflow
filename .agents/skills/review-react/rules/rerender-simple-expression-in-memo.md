---
title: Don't useMemo for Simple Primitive Expressions
impact: MEDIUM
impactDescription: useMemo overhead exceeds the cost of trivial computations
tags: rerender, useMemo, premature-optimization
---

## Don't useMemo for Simple Primitive Expressions

**Impact: MEDIUM (useMemo overhead exceeds the cost of trivial computations)**

`useMemo` has overhead (dependency comparison, closure allocation). For simple math or string operations that produce primitives, the memoization cost exceeds the computation cost.

**Incorrect (memoizing trivial expression):**

```tsx
function Progress({ current, total }) {
  const percentage = useMemo(() => Math.round((current / total) * 100), [current, total])
  return <span>{percentage}%</span>
}
```

**Correct (compute inline):**

```tsx
function Progress({ current, total }) {
  const percentage = Math.round((current / total) * 100)
  return <span>{percentage}%</span>
}
```

Reserve `useMemo` for expensive computations (large array transformations, complex calculations) or when the result is an object/array passed to a memoized child.

Reference: [useMemo](https://react.dev/reference/react/useMemo)

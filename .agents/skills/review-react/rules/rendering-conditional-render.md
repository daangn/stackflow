---
title: Use Ternary for Conditional Rendering
impact: MEDIUM
impactDescription: prevents rendering "0" or "" as visible text
tags: rendering, conditional, ternary, falsy-values
---

## Use Ternary for Conditional Rendering

**Impact: MEDIUM (prevents rendering "0" or "" as visible text)**

The `&&` operator with non-boolean left operands can render unexpected falsy values like `0` or `""` as visible text in the DOM.

**Incorrect (falsy number renders as "0"):**

```tsx
function Notifications({ count }) {
  return <div>{count && <Badge count={count} />}</div>
  // When count is 0, renders "0" as text
}
```

**Correct (explicit ternary):**

```tsx
function Notifications({ count }) {
  return <div>{count > 0 ? <Badge count={count} /> : null}</div>
}
```

**Also correct (double negation for boolean coercion):**

```tsx
function Notifications({ count }) {
  return <div>{!!count && <Badge count={count} />}</div>
}
```

This is especially important with numeric values (`0`), empty strings (`""`), and `NaN`. Boolean, `null`, and `undefined` are safe with `&&`.

Reference: [Conditional Rendering](https://react.dev/learn/conditional-rendering)

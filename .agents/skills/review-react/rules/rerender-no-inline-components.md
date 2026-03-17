---
title: Never Define Components Inside Components
impact: MEDIUM
impactDescription: causes full remount and state loss on every parent render
tags: rerender, inline-components, state-loss
---

## Never Define Components Inside Components

**Impact: MEDIUM (causes full remount and state loss on every parent render)**

When a component is defined inside another component, React creates a new component type on every render. This forces React to unmount and remount the inner component, destroying all its state.

**Incorrect (component defined inside parent):**

```tsx
function Parent() {
  // New function identity every render = new component type
  function Child() {
    const [count, setCount] = useState(0)
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>
  }

  return <Child />
}
```

**Correct (component defined outside parent):**

```tsx
function Child() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

function Parent() {
  return <Child />
}
```

This applies to all forms: arrow functions, function declarations, and class expressions inside render.

Reference: [Don't define components inside other components](https://react.dev/learn/your-first-component#nesting-and-organizing-components)

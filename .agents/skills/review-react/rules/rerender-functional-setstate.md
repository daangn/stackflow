---
title: Use Functional setState for Stable Callbacks
impact: MEDIUM
impactDescription: eliminates state from callback dependencies, enabling stable references
tags: rerender, setState, useCallback, functional-update
---

## Use Functional setState for Stable Callbacks

**Impact: MEDIUM (eliminates state from callback dependencies, enabling stable references)**

When a callback reads current state only to compute the next state, use the functional form of setState. This removes the state variable from the dependency array, producing a stable callback reference.

**Incorrect (state in dependency causes new callback each update):**

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount(count + 1)
  }, [count]) // New function every time count changes

  return <ExpensiveChild onClick={increment} />
}
```

**Correct (functional update removes dependency):**

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount(prev => prev + 1)
  }, []) // Stable reference

  return <ExpensiveChild onClick={increment} />
}
```

This pattern also avoids stale closure bugs where the callback captures an outdated `count` value.

Reference: [useState](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)

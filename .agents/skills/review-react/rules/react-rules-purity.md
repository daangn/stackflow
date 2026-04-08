---
title: Components and Hooks Must Be Pure
impact: CRITICAL
impactDescription: prevents bugs from non-deterministic rendering
tags: react-rules, purity, side-effects, immutability
---

## Components and Hooks Must Be Pure

**Impact: CRITICAL (prevents bugs from non-deterministic rendering)**

React assumes components are pure functions: same inputs, same output. Side effects during render cause bugs that are hard to reproduce, especially with concurrent features and Strict Mode.

### Rule 1: Components must be idempotent

**Incorrect (mutating external variable during render):**

```tsx
let count = 0

function Counter() {
  count++ // Side effect during render
  return <p>{count}</p>
}
```

**Correct (use state for mutable values):**

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  return <p>{count}</p>
}
```

### Rule 2: Side effects must run outside of render

**Incorrect (side effect in render):**

```tsx
function ProductList({ items }) {
  analytics.track('viewed', items.length) // Runs on every render
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
}
```

**Correct (side effect in effect or event handler):**

```tsx
function ProductList({ items }) {
  useEffect(() => {
    analytics.track('viewed', items.length)
  }, [items.length])
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
}
```

### Rule 3: Props and state are immutable

**Incorrect (mutating props):**

```tsx
function List({ items }) {
  items.push({ id: 'last' }) // Mutating prop
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
}
```

**Correct (create new values):**

```tsx
function List({ items }) {
  const allItems = [...items, { id: 'last', name: 'Last' }]
  return <ul>{allItems.map(i => <li key={i.id}>{i.name}</li>)}</ul>
}
```

### Rule 4: Return values and arguments to Hooks are immutable

**Incorrect (mutating hook return value):**

```tsx
function useItems() {
  const items = useContext(ItemsContext)
  items.sort() // Mutating context value
  return items
}
```

**Correct (copy before mutating):**

```tsx
function useItems() {
  const items = useContext(ItemsContext)
  return [...items].sort()
}
```

### Rule 5: Values are immutable after being passed to JSX

**Incorrect (mutating after JSX use):**

```tsx
function Page({ title }) {
  const config = { title }
  const element = <Header config={config} />
  config.title = 'changed' // Mutating after JSX use
  return element
}
```

**Correct (don't mutate after passing to JSX):**

```tsx
function Page({ title }) {
  const config = { title }
  return <Header config={config} />
}
```

### Rule 6: Never write refs during render when external code reads them synchronously

Render-phase ref writes (`ref.current = value`) are dangerous when **code outside React** (store subscribers, event bus listeners, framework lifecycle hooks) can read that ref synchronously between renders.

In Concurrent Mode, React may **abandon** a render and start a new one with different props. If you wrote to the ref during the abandoned render, external readers see a value from a render that never committed — a value that doesn't correspond to any committed UI state.

This is **not** mitigated by the write being "idempotent" — the problem isn't double-writes from Strict Mode, it's writes from renders that are discarded entirely.

**Incorrect (render-phase ref write with external reader):**

```tsx
function useEventBusHandler(bus: EventBus, event: string, handler: () => void) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler // ← render phase write

  useEffect(() => {
    // External subscriber reads handlerRef on every event
    return bus.on(event, () => handlerRef.current())
  }, [bus, event])
}

// Meanwhile, outside React:
// bus.emit() fires synchronously on state change — may read a ref
// written by a render that React later abandoned
```

**Correct (ref updated only in useEffect):**

```tsx
function useEventBusHandler(bus: EventBus, event: string, handler: () => void) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler // ← commit phase only
  })

  useEffect(() => {
    return bus.on(event, () => handlerRef.current())
  }, [bus, event])
}
```

The trade-off: between render and commit, the subscriber may read a one-step-old handler. But a stale-but-committed value is always safer than a value from a render that never committed.

**Key principle:** Do not make assumptions about React's scheduling. "This render will commit before anything else happens" is never guaranteed in Concurrent Mode. Any optimization based on that assumption will break.

Reference: [Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

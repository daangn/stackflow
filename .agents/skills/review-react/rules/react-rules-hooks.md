---
title: Rules of Hooks
impact: CRITICAL
impactDescription: violating causes runtime errors and broken state
tags: react-rules, hooks, top-level
---

## Rules of Hooks

**Impact: CRITICAL (violating causes runtime errors and broken state)**

Hooks rely on a stable call order. Calling them conditionally or in loops breaks React's ability to track state correctly.

### Rule 1: Only call Hooks at the top level

**Incorrect (hook inside condition):**

```tsx
function Form({ showName }) {
  if (showName) {
    const [name, setName] = useState('') // Conditional hook call
  }
  const [email, setEmail] = useState('')
  return <input value={email} onChange={e => setEmail(e.target.value)} />
}
```

**Correct (always call hooks, conditionally use values):**

```tsx
function Form({ showName }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  return (
    <>
      {showName && <input value={name} onChange={e => setName(e.target.value)} />}
      <input value={email} onChange={e => setEmail(e.target.value)} />
    </>
  )
}
```

**Incorrect (hook inside loop):**

```tsx
function Filters({ filters }) {
  const values = []
  for (const f of filters) {
    values.push(useState(f.default)) // Hook in loop
  }
  return <>{/* ... */}</>
}
```

**Correct (extract to child component or use single state):**

```tsx
function Filters({ filters }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(filters.map(f => [f.id, f.default]))
  )
  return <>{/* ... */}</>
}
```

### Rule 2: Only call Hooks from React functions

**Incorrect (hook in regular function):**

```tsx
function getUser() {
  const [user, setUser] = useState(null) // Not a React component
  return user
}
```

**Correct (hook in component or custom hook):**

```tsx
function useUser() {
  const [user, setUser] = useState(null)
  return user
}

function Profile() {
  const user = useUser()
  return <p>{user?.name}</p>
}
```

Reference: [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

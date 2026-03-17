---
title: React Calls Components and Hooks
impact: CRITICAL
impactDescription: breaks React's rendering model and optimization
tags: react-rules, components, hooks, calling-convention
---

## React Calls Components and Hooks

**Impact: CRITICAL (breaks React's rendering model and optimization)**

React must control when components render and hooks execute. Calling them directly bypasses reconciliation, state management, and optimization.

### Rule 1: Never call component functions directly

**Incorrect (calling component as function):**

```tsx
function Parent() {
  // This bypasses React's rendering, no proper lifecycle or state isolation
  return <div>{Profile({ name: 'Alice' })}</div>
}
```

**Correct (use JSX):**

```tsx
function Parent() {
  return <div><Profile name="Alice" /></div>
}
```

Calling a component as a function makes React treat it as part of the parent's render. This means:
- No separate fiber node for reconciliation
- State and effects are tied to the parent
- Keys and refs don't work as expected

### Rule 2: Never pass Hooks as regular values

**Incorrect (passing hook as prop):**

```tsx
function ChatRoom({ useStatus }) {
  const status = useStatus() // Hook passed as value
  return <p>{status}</p>
}

<ChatRoom useStatus={useOnlineStatus} />
```

**Correct (call hook directly, pass result as prop):**

```tsx
function ChatRoom({ status }) {
  return <p>{status}</p>
}

function ChatRoomWrapper() {
  const status = useOnlineStatus()
  return <ChatRoom status={status} />
}
```

Passing hooks as values makes them opaque to React's static analysis, breaks the Rules of Hooks, and prevents the compiler from optimizing correctly.

Reference: [React calls Components and Hooks](https://react.dev/reference/rules/react-calls-components-and-hooks)

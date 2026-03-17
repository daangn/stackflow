---
title: Initialize App-Level Singletons Once
impact: LOW
impactDescription: prevents duplicate initialization in Strict Mode and re-mounts
tags: advanced, initialization, singleton, module-scope
---

## Initialize App-Level Singletons Once

**Impact: LOW (prevents duplicate initialization in Strict Mode and re-mounts)**

App-level setup (analytics, error tracking, SDK initialization) should run once per app load, not per component mount. Strict Mode double-invokes effects, causing duplicate initialization.

**Incorrect (initialization in effect runs twice in Strict Mode):**

```tsx
function App() {
  useEffect(() => {
    analytics.init('key') // Runs twice in Strict Mode
    errorTracker.setup()  // May cause duplicate event listeners
  }, [])

  return <Router />
}
```

**Correct (module-level initialization):**

```tsx
// app-init.ts
let initialized = false

export function initApp() {
  if (initialized) return
  initialized = true
  analytics.init('key')
  errorTracker.setup()
}
```

```tsx
// App.tsx
import { initApp } from './app-init'

initApp() // Runs once at module evaluation

function App() {
  return <Router />
}
```

**Also correct (top-level flag guard):**

```tsx
let didInit = false

function App() {
  useEffect(() => {
    if (didInit) return
    didInit = true
    analytics.init('key')
  }, [])

  return <Router />
}
```

Reference: [How to handle the Effect firing twice in development](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)

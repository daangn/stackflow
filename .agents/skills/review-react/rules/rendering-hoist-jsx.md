---
title: Hoist Static JSX Outside Component Functions
impact: MEDIUM
impactDescription: avoids recreating identical React elements on every render
tags: rendering, static-jsx, hoisting, optimization
---

## Hoist Static JSX Outside Component Functions

**Impact: MEDIUM (avoids recreating identical React elements on every render)**

JSX that doesn't depend on props, state, or context produces the same output every render. Hoist it to module scope so React creates the element once and reuses it.

**Incorrect (static JSX recreated every render):**

```tsx
function Layout({ children }) {
  return (
    <div>
      <header>
        <h1>My App</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </nav>
      </header>
      {children}
    </div>
  )
}
```

**Correct (static parts hoisted):**

```tsx
const header = (
  <header>
    <h1>My App</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
)

function Layout({ children }) {
  return (
    <div>
      {header}
      {children}
    </div>
  )
}
```

React Compiler does this automatically. If you use React Compiler, this optimization is handled for you.

Reference: [React Compiler](https://react.dev/learn/react-compiler)

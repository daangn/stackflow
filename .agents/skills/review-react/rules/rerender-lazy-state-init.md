---
title: Use Lazy State Initialization
impact: MEDIUM
impactDescription: avoids running expensive initialization on every render
tags: rerender, useState, lazy-init, initialization
---

## Use Lazy State Initialization

**Impact: MEDIUM (avoids running expensive initialization on every render)**

When you pass a value to `useState`, it's evaluated on every render even though React only uses it on the first render. Pass a function instead for expensive computations.

**Incorrect (expensive computation runs every render):**

```tsx
function Editor({ content }) {
  // parseMarkdown runs on EVERY render, result is discarded after first
  const [parsed, setParsed] = useState(parseMarkdown(content))
  return <Preview data={parsed} />
}
```

**Correct (lazy initializer runs only on first render):**

```tsx
function Editor({ content }) {
  const [parsed, setParsed] = useState(() => parseMarkdown(content))
  return <Preview data={parsed} />
}
```

This applies to any non-trivial computation: parsing, complex object construction, reading from storage, etc.

Reference: [useState](https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state)

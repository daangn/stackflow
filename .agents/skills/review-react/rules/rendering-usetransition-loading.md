---
title: Prefer useTransition Over Manual Loading State
impact: MEDIUM
impactDescription: avoids flash of loading state and keeps UI responsive
tags: rendering, useTransition, loading, isPending
---

## Prefer useTransition Over Manual Loading State

**Impact: MEDIUM (avoids flash of loading state and keeps UI responsive)**

Manual boolean loading state (`setLoading(true/false)`) can cause flashes and blocks the UI. `useTransition` gives React control over when to show loading indicators.

**Incorrect (manual loading state):**

```tsx
function TabPanel() {
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(false)

  const switchTab = async (newTab: string) => {
    setLoading(true)
    setTab(newTab)
    setLoading(false) // Flash of loading state
  }

  return (
    <div>
      {loading && <Spinner />}
      <TabContent tab={tab} />
    </div>
  )
}
```

**Correct (useTransition):**

```tsx
function TabPanel() {
  const [tab, setTab] = useState('home')
  const [isPending, startTransition] = useTransition()

  const switchTab = (newTab: string) => {
    startTransition(() => {
      setTab(newTab)
    })
  }

  return (
    <div>
      {isPending && <Spinner />}
      <TabContent tab={tab} />
    </div>
  )
}
```

`useTransition` lets React keep showing the old UI until the new one is ready, preventing layout shifts and blank screens.

Reference: [useTransition](https://react.dev/reference/react/useTransition)

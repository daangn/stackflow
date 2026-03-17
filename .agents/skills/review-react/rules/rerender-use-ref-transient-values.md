---
title: Use Refs for Frequently-Changing Transient Values
impact: MEDIUM
impactDescription: avoids high-frequency re-renders from values not needed in JSX
tags: rerender, useRef, transient, scroll, mouse, animation
---

## Use Refs for Frequently-Changing Transient Values

**Impact: MEDIUM (avoids high-frequency re-renders from values not needed in JSX)**

Values that change at high frequency (scroll position, mouse coordinates, animation progress) but aren't displayed in JSX should be stored in refs to avoid triggering re-renders.

**Incorrect (state for high-frequency value):**

```tsx
function Scroller() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY) // Re-render per scroll event
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // scrollY only used to check a threshold, not displayed
  useEffect(() => {
    if (scrollY > 100) showFloatingButton()
  }, [scrollY])
}
```

**Correct (ref for transient value):**

```tsx
function Scroller() {
  const scrollY = useRef(0)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const handler = () => {
      scrollY.current = window.scrollY
      setShowButton(scrollY.current > 100) // Only re-renders when boolean changes
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return showButton ? <FloatingButton /> : null
}
```

Combine with `requestAnimationFrame` for animation-related values to further reduce work.

Reference: [useRef](https://react.dev/reference/react/useRef)

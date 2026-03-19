# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Rules of React (react-rules)

**Impact:** CRITICAL
**Description:** Fundamental rules from react.dev that ensure correctness. Components must be pure, Hooks must follow call rules, and components must not be called as functions.

## 2. Re-render Optimization (rerender)

**Impact:** MEDIUM
**Description:** Patterns to minimize unnecessary re-renders: proper memoization, derived state, functional setState, and effect dependency management.

## 3. Rendering Performance (rendering)

**Impact:** MEDIUM
**Description:** Techniques to optimize what and how React renders: hoisting static JSX, conditional rendering patterns, content-visibility, and transitions.

## 4. Advanced Patterns (advanced)

**Impact:** LOW
**Description:** Specialized techniques for edge cases: storing handlers in refs for stable callbacks and one-time initialization patterns.

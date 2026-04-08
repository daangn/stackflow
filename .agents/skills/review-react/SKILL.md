---
name: review-react
description: >
  React code review guidelines covering Rules of React, re-render optimization,
  rendering performance, and advanced patterns. Activates when writing, reviewing,
  or refactoring React components, hooks, or state management code.
---

# React Code Review Guidelines

Performance optimization and correctness guide for React applications. Contains 23 rules across 4 categories, prioritized by impact.

## When to Apply

Reference these guidelines when:
- Writing or reviewing React components and hooks
- Optimizing re-render performance
- Refactoring state management or effect logic
- Reviewing pull requests that touch React code

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Rules of React | CRITICAL | `react-rules-` | 3 |
| 2 | Re-render Optimization | MEDIUM | `rerender-` | 13 |
| 3 | Rendering Performance | MEDIUM | `rendering-` | 5 |
| 4 | Advanced Patterns | LOW | `advanced-` | 2 |

## Quick Reference

### 1. Rules of React (CRITICAL)

- `react-rules-purity` - Components and Hooks must be pure; no side effects during render
- `react-rules-hooks` - Only call Hooks at the top level and from React functions
- `react-rules-calling` - Never call components as functions or pass Hooks as values

### 2. Re-render Optimization (MEDIUM)

- `rerender-no-inline-components` - Never define components inside other components
- `rerender-derived-state-no-effect` - Derive state during render, not in effects
- `rerender-memo` - Extract memoized child components to avoid re-renders
- `rerender-memo-with-default-value` - Hoist default non-primitive props outside memo
- `rerender-simple-expression-in-memo` - Don't useMemo for simple primitive expressions
- `rerender-defer-reads` - Don't subscribe to state only used in callbacks
- `rerender-dependencies` - Use primitive values in effect dependencies
- `rerender-derived-state` - Subscribe to derived booleans, not raw objects
- `rerender-functional-setstate` - Use functional setState for stable callbacks
- `rerender-lazy-state-init` - Pass initializer function to useState for expensive values
- `rerender-move-effect-to-event` - Move interaction logic from effects to event handlers
- `rerender-transitions` - Use startTransition for non-urgent state updates
- `rerender-use-ref-transient-values` - Use refs for frequently-changing transient values

### 3. Rendering Performance (MEDIUM)

- `rendering-hoist-jsx` - Hoist static JSX outside component functions
- `rendering-conditional-render` - Use ternary operator instead of && for conditional rendering
- `rendering-usetransition-loading` - Prefer useTransition over manual loading state
- `rendering-content-visibility` - Use CSS content-visibility: auto for long lists
- `rendering-activity` - Use Activity component for preserving hidden UI state

### 4. Advanced Patterns (LOW)

- `advanced-event-handler-refs` - Store latest event handlers in refs for stable callbacks
- `advanced-init-once` - Initialize app-level singletons once, not per mount

## Review Discipline

### Never downgrade CRITICAL violations

When a CRITICAL rule violation is detected (e.g., `react-rules-purity`), **fix it — do not rationalize exceptions**. Common rationalizations to reject:

- "It's idempotent, so Strict Mode double-render is fine" — Strict Mode is not the only concern; Concurrent Mode render abandonment is the real danger.
- "It works in practice" — Concurrent features may not be active today but the code must be correct when they are.
- "Adding a comment explaining the intent is sufficient" — A comment does not prevent the bug. If the rule says "don't do X", the fix is to stop doing X.

If you detect a violation, move to "fix" before moving to "judge severity." The cost of a false positive (unnecessary refactor) is far lower than the cost of a false negative (shipping a Concurrent Mode bug).

### Re-check after refactors

When a fix for one issue changes the code structure (e.g., adding `callback` to useEffect deps), **re-run the full rule check** on the modified code. A fix for one rule can regress another — e.g., fixing `rerender-dependencies` can reintroduce a `react-rules-purity` violation if it moves code back into render phase.

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/react-rules-purity.md
rules/rerender-no-inline-components.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example
- Correct code example
- Reference links

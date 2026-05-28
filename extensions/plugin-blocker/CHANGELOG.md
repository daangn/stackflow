# @stackflow/plugin-blocker

## 0.1.1

### Patch Changes

- Updated dependencies [273d45f]
- Updated dependencies [273d45f]
- Updated dependencies [cef9c62]
  - @stackflow/core@2.0.0
  - @stackflow/react@2.0.0

## 0.1.0

### Minor Changes

- c740c5e: Add blockerPlugin and useBlocker hook for navigation blocking

  - `useBlocker({ shouldBlock, onBlocked })` hook to declare blocking policies per activity
  - Blocking set model: multiple blockers can block a navigation, all must `proceed()` for it to execute
  - Only blockers from active (`isActive: true`) activities are evaluated
  - `onBlocked` notifications are serialized in navigation occurrence order (no re-entrancy)
  - Error isolation: one blocker's `onBlocked` throwing does not prevent other blockers from being notified
  - Plugin-level `onError` option for custom error handling (defaults to `console.error`)
  - Blocker cleanup on component unmount; previously captured `proceed` remains callable

---
"@stackflow/core": minor
"@stackflow/plugin-history-sync": minor
---

Allow step actions to target lower activities with targetActivityId

**Core Changes:**
- Step actions (stepPush, stepPop, stepReplace) can now target any activity in the stack using `targetActivityId` option
- Previously only the top activity could be targeted
- Enables modifying previous activity parameters when popping current activity

**History Sync Plugin Changes:**
- Added intelligent synchronization when navigating to modified lower activities
- Uses `history.back()` for step pop to avoid duplicate entries
- Uses `replaceState()` for step push/replace (accepts forward history volatility per stack semantics)
- Handles complex step operation sequences correctly

**Use Case:**
```typescript
// Pop and modify previous activity in single operation
actions.pop({
  onBeforePop: () => {
    actions.stepReplace({ newParams }, { targetActivityId: previousActivityId });
  }
});
```

This is backward compatible - existing code works without changes.

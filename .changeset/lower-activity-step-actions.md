---
"@stackflow/core": minor
"@stackflow/plugin-history-sync": minor
---

Allow step actions to target lower activities with targetActivityId

**Core Changes:**
- Step actions (stepPush, stepPop, stepReplace) can now target any activity in the stack using `targetActivityId` option
- Previously only the top activity could be targeted
- Enables modifying lower activity steps when popping current activity

**History Sync Plugin Changes:**
- Added intelligent synchronization when navigating to lower activities with removed steps
- When navigating back to a step that was removed via `stepPop`, automatically skips the removed entry
- Uses `history.back()` to navigate to the correct remaining step

**Use Case:**
```typescript
// Remove a step from a lower activity while at top activity
actions.stepPop({ targetActivityId: lowerActivityId });

// When user navigates back, the removed step entry is automatically skipped
history.back(); // Skips removed step, lands on the correct step
```

This is backward compatible - existing code works without changes.

---
"@stackflow/react": minor
---

Add prefetch API for lazy activity component and loader data.
- A hook `usePrepare()` which returns `prepare(activityName[, activityParams])` is added for navigation warmup.
- A hook `useActivityPreparation(activityNames)` for preparing navigations inside a component is added.
---
"@stackflow/core": minor
"@stackflow/react": patch
---

Expose the live, action-local `actions.isPrevented()` state to every pre-effect hook, and make the React loader skip loader, preload, and pause work for prevented actions. Update both packages together to enable the new contract while preserving normal navigation with older Core runtimes.

---
"@stackflow/plugin-history-sync": patch
---

Fix an SSR hydration mismatch that occurred when an activity declared a non-empty `defaultHistory`.

The staged `defaultHistory` setup navigation was kicked off synchronously inside the `onInit` hook, which runs during the first client render. As a result, the client's first render contained more activities than the server-rendered output, producing a React hydration mismatch.

The setup navigation is now kicked off from a post-commit effect instead, so the server and the client's first render produce identical output (eliminating the mismatch) while the staged "stacking" setup animation still plays after hydration.

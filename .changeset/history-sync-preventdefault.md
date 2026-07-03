---
"@stackflow/plugin-history-sync": minor
---

Support `preventDefault` (FEP-2001): the browser history now follows the committed stack through a single reconciler, so `preventDefault`-based plugins (e.g. `@stackflow/plugin-blocker`) work with browser back/forward and programmatic navigation without history/stack desync.

---
"@stackflow/core": patch
---

Fix intermittent incorrect transition state when `transitionDuration` is set to 0 by ensuring `now >= eventDate` in the initial aggregate call within `dispatchEvent`.

---
"@stackflow/link": major
---

Promote Future API to the default entry point and remove the legacy Stable API.

- `@stackflow/link/future` and `@stackflow/link/stable` sub-paths removed. Import from `@stackflow/link` directly.
- `createLinkComponent()` removed. Use `import { Link } from "@stackflow/link"` directly.
- `LinkProps.urlPatternOptions` removed. Link URL generation now uses `config.historySync.urlPatternOptions`.

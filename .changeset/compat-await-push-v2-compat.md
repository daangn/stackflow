---
"@stackflow/compat-await-push": minor
---

Remove unused `@stackflow/core` and `@stackflow/react` peer dependencies. The package is a pure Promise-based utility and does not import Stackflow internals, so it works in any environment regardless of the installed Stackflow major version.

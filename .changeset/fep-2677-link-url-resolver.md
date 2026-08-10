---
"@stackflow/link": major
---

Require Link consumers to provide a URL resolver through
`LinkUrlResolverProvider`. This removes Link's direct dependency on
`@stackflow/plugin-history-sync` and keeps generated URLs consistent with the
configured routing plugin.

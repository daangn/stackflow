---
"@stackflow/plugin-sentry": patch
---

Support Sentry 11. `@sentry/core` 11 removed `SEMANTIC_ATTRIBUTE_SENTRY_SOURCE`, so importing the plugin failed. The plugin now sets the span name source on `sentry.segment.name.source` with Sentry 11 and on `sentry.source` with Sentry 8-10.

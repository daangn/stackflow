---
"@stackflow/plugin-history-sync": patch
---

Fix `fallbackActivity` callback being invoked on every initialization regardless of route matching outcome. Restored the pre-1.8.0 contract: the callback is now called only when no route matches `currentPath`. Apps that perform side effects in this callback (e.g. Sentry logging for unknown deep links) no longer fire on successful matches.

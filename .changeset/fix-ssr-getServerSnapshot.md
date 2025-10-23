---
"@stackflow/plugin-history-sync": patch
---

Fix SSR compatibility by adding getServerSnapshot parameter to useSyncExternalStore. This resolves the "Missing getServerSnapshot, which is required for server-rendered content" error in SSR environments.

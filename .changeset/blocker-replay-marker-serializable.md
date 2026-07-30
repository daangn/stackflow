---
"@stackflow/plugin-blocker": patch
---

Use a namespaced string key instead of a `Symbol` for the internal replay marker. A `Symbol`-keyed property leaked into the recorded event log, so a captured `StackSnapshot` containing a blocked-then-proceeded navigation could not be serialized by codecs that reject symbol keys (e.g. `devalue` throws `Cannot stringify POJOs with symbolic keys`). The marker is now a plain, serializable key.

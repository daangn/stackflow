---
"@stackflow/plugin-stack-persistence": minor
---

Parse unknown persisted metadata before reuse with reusable metadata definitions. `StackSnapshotStrategy` now exposes `metadata.create` and `metadata.parse`, storage loads unknown metadata, and composed strategies persist and validate schema/version envelopes.

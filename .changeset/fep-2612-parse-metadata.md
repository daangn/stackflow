---
"@stackflow/plugin-stack-persistence": major
---

`StackSnapshotStrategy` now exposes `metadata.create` and `metadata.parse`, storage loads unknown metadata, and composed strategies persist and validate schema/version envelopes. Metadata parse failures can include details and are reported through `onRecordLoadError`.

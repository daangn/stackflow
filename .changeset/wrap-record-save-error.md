---
"@stackflow/plugin-stack-persistence": patch
---

Wrap storage save failures in `StackSnapshotRecordSaveError` before invoking `onRecordSaveError` or rethrowing, matching the declared handler signature and the load-path behavior.

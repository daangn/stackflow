import type { StackSnapshot } from "@stackflow/core";

export type StackSnapshotRecord<Metadata> = {
  snapshot: StackSnapshot;
  metadata: Metadata;
};

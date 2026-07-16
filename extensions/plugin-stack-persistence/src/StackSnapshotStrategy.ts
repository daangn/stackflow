import type { StackSnapshot } from "@stackflow/core";
import type { StackSnapshotRecord } from "./StackSnapshotRecord";

export interface StackSnapshotStrategy<Metadata> {
  createMetadata(args: {
    snapshot: StackSnapshot;
    initialContext: unknown;
  }): Metadata;

  shouldReuse(args: {
    record: StackSnapshotRecord<Metadata>;
    initialContext: unknown;
  }): boolean;
}

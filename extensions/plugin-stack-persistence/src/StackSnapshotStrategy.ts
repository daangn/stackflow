import type { Stack, StackSnapshot } from "@stackflow/core";
import type { StackSnapshotRecord } from "./StackSnapshotRecord";

export interface StackSnapshotStrategy<Metadata> {
  createMetadata(args: { stack: Stack; snapshot: StackSnapshot }): Metadata;

  shouldReuse(args: {
    record: StackSnapshotRecord<Metadata>;
    initialContext: unknown;
  }): boolean;
}

import type { StackSnapshotMetadataDefinition } from "./StackSnapshotMetadataDefinition";
import type { StackSnapshotRecord } from "./StackSnapshotRecord";

export interface StackSnapshotStrategy<Metadata> {
  metadata: StackSnapshotMetadataDefinition<Metadata>;

  shouldReuse(args: {
    record: StackSnapshotRecord<Metadata>;
    initialContext: unknown;
  }): boolean;
}

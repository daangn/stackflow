import type { StackSnapshotRecord } from "./StackSnapshotRecord";

export interface StackSnapshotStorage<Metadata> {
  load(): StackSnapshotRecord<unknown> | null;
  save(record: StackSnapshotRecord<Metadata>): Promise<void>;
}

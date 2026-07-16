import type { StackSnapshotRecord } from "./StackSnapshotRecord";

export interface StackSnapshotStorage<Metadata> {
  load(): StackSnapshotRecord<Metadata> | null;
  save(record: StackSnapshotRecord<Metadata>): Promise<void>;
}

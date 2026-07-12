/**
 * Contract: `StackSnapshotRecord` is exactly `{ snapshot, metadata }` and
 * `StackSnapshotStorage` is exactly synchronous-read / asynchronous-write.
 * The record has no `$schema`/version envelope of its own.
 */
import type { StackSnapshot } from "@stackflow/core";
import type {
  StackSnapshotRecord,
  StackSnapshotStorage,
} from "@stackflow/plugin-stack-persistence";
import type { Equal, Expect } from "./helpers";

declare const snapshot: StackSnapshot;

// Default generic: metadata is undefined and must be present on the record.
export const record: StackSnapshotRecord = { snapshot, metadata: undefined };

export const storage: StackSnapshotStorage = {
  load: () => record,
  save: (incoming: StackSnapshotRecord) => Promise.resolve(void incoming),
};

// Synchronous read, asynchronous write — exactly this shape compiles.
export const loaded: StackSnapshotRecord | null = storage.load();
export const written: Promise<void> = storage.save(record);
export const recordSnapshot: StackSnapshot = record.snapshot;
export const recordMetadata: undefined = record.metadata;

// The record's keys are exactly `snapshot | metadata`.
export type RecordKeys = Expect<
  Equal<keyof StackSnapshotRecord, "snapshot" | "metadata">
>;

// --- negative controls ---

export const asyncLoadStorage: StackSnapshotStorage = {
  // @ts-expect-error load는 동기 계약이다 — Promise를 반환할 수 없다
  load: async () => null,
  save: () => Promise.resolve(),
};

export const syncSaveStorage: StackSnapshotStorage = {
  load: () => null,
  // @ts-expect-error save는 항상 Promise<void>를 반환해야 한다
  save: () => {},
};

// @ts-expect-error metadata를 생략한 record는 record 계약이 아니다
export const metadataMissing: StackSnapshotRecord = { snapshot };

// @ts-expect-error record 자체에는 $schema envelope가 없다
export const envelopeSchema = record.$schema;

// @ts-expect-error record 자체에는 version 필드가 없다
export const envelopeVersion = record.version;

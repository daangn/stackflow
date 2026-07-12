import type { StackSnapshot } from "@stackflow/core";

/**
 * What the storage persists and hands back: the core snapshot plus the
 * strategy's opaque metadata. Without a strategy, `Metadata` is `undefined`
 * and the plugin initializes `metadata` to `undefined`. The record itself
 * carries no `$schema`/version envelope — the core snapshot versions itself
 * via `snapshot.$schema`, and metadata versioning belongs to the strategy and
 * the storage.
 */
export type StackSnapshotRecord<Metadata = undefined> = {
  snapshot: StackSnapshot;
  metadata: Metadata;
};

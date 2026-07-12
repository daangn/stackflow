import type { StackSnapshot } from "@stackflow/core";
import type { StackSnapshotRecord } from "./StackSnapshotRecord";

/**
 * Optional consumer-injected policy that owns the meaning of a record's
 * metadata. The plugin treats metadata as opaque.
 *
 * Both methods are synchronous contracts — a strategy that depends on
 * asynchronous information must have it prepared before the stack is
 * created. `initialContext` is `unknown` (not `any`): the strategy narrows
 * it to whatever shape it needs.
 *
 * - `createMetadata` runs on the save path only, deriving the metadata that
 *   is persisted together with the captured snapshot.
 * - `shouldReuse` runs on the load path only, deciding from the whole stored
 *   record and the current start context whether the snapshot applies to
 *   this stack creation. It may observe and interpret the record but not
 *   modify it, and it can only answer the reuse question — it cannot return
 *   a transformed snapshot or a merge result.
 */
export interface StackSnapshotStrategy<Metadata> {
  createMetadata(args: {
    snapshot: StackSnapshot;
    initialContext: unknown;
  }): Metadata;

  shouldReuse(args: {
    record: Readonly<StackSnapshotRecord<Metadata>>;
    initialContext: unknown;
  }): boolean;
}

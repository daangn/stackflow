/**
 * Consumer-fidelity compile fixture: everything a consumer needs must
 * compile strictly from the built package entrypoint (the emitted
 * declarations, not the sources) plus `@stackflow/core` — with no React
 * types installed or referenced.
 */
import type { StackflowPlugin } from "@stackflow/core";
import type {
  StackSnapshotRecord,
  StackSnapshotStorage,
  StackSnapshotStrategy,
} from "@stackflow/plugin-stack-persistence";
import {
  type StackPersistenceSaveError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";

declare const storage: StackSnapshotStorage;

export const plugin: StackflowPlugin = stackPersistencePlugin({
  storage,
  onStorageLoadError: () => null,
  onLoadError: () => ({ policy: "propagate" }),
  onSaveError: ({ error }) => {
    const seen: StackPersistenceSaveError = error;
    void seen;
  },
});

export declare const record: StackSnapshotRecord;
export declare const strategy: StackSnapshotStrategy<{ url: string }>;

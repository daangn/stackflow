/**
 * Contract: every confirmed public name is importable from the package
 * entrypoint alone, the two callbacks are usable in the plugin options,
 * and the return value is assignable to the core plugin contract. No
 * internal-path import is needed.
 */
import type { SnapshotLoadError, StackflowPlugin } from "@stackflow/core";
import type {
  StackPersistenceErrorHandlers,
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
  onStorageLoadError(args: { error: unknown; initialContext: unknown }) {
    void args;
    return null;
  },
  onLoadError(args: { error: SnapshotLoadError; initialContext: unknown }) {
    void args;
    return { policy: "propagate" as const };
  },
  onSaveError(args: { error: StackPersistenceSaveError }) {
    void args.error;
  },
});

// The save error class is a value export usable as an Error subclass.
declare const saveError: StackPersistenceSaveError;
export const errors: [Error] = [saveError];

// The record/storage/strategy types are directly usable from the entrypoint.
export declare const record: StackSnapshotRecord;
export declare const strategy: StackSnapshotStrategy<{ version: number }>;
export declare const handlers: StackPersistenceErrorHandlers<{
  version: number;
}>;

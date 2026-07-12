/**
 * Contract: every confirmed public name is importable from the package
 * entrypoint alone, the two callbacks are usable in the plugin options,
 * and the return value is assignable to the core plugin contract. No
 * internal-path import is needed.
 */
import type { SnapshotLoadError, StackflowPlugin } from "@stackflow/core";
import type {
  StackSnapshotRecord,
  StackSnapshotStorage,
  StackSnapshotStrategy,
} from "@stackflow/plugin-stack-persistence";
import {
  StackPersistenceLoadError,
  type StackPersistenceSaveError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";

declare const storage: StackSnapshotStorage;

export const plugin: StackflowPlugin = stackPersistencePlugin({
  storage,
  onLoadError(args: {
    error: StackPersistenceLoadError | SnapshotLoadError;
    initialContext: unknown;
  }) {
    return args.error instanceof StackPersistenceLoadError
      ? { policy: "recover" as const }
      : { policy: "propagate" as const };
  },
  onSaveError(args: { error: StackPersistenceSaveError }) {
    void args.error;
  },
});

// The two error classes are value exports usable as Error subclasses.
declare const loadError: StackPersistenceLoadError;
declare const saveError: StackPersistenceSaveError;
export const errors: [Error, Error] = [loadError, saveError];

// The record/storage/strategy types are directly usable from the entrypoint.
export declare const record: StackSnapshotRecord;
export declare const strategy: StackSnapshotStrategy<{ version: number }>;

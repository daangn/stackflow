import type { SnapshotLoadError, StackflowPlugin } from "@stackflow/core";
import type {
  StackPersistenceLoadError,
  StackPersistenceSaveError,
} from "./errors";
import type { StackSnapshotStorage } from "./StackSnapshotStorage";
import type { StackSnapshotStrategy } from "./StackSnapshotStrategy";

/**
 * Error handlers shared by every options shape.
 *
 * - `onLoadError` receives expected load failures (storage/strategy stage as
 *   `StackPersistenceLoadError`, core validation as core's own
 *   `SnapshotLoadError`, identity preserved) together with the start
 *   context, and answers the policy: `recover` abandons the snapshot and
 *   falls back to a fresh stack, `propagate` rethrows the very same error
 *   object. Omitting the handler defaults to `recover`.
 * - `onSaveError` receives each failed save individually. Its return value
 *   has no effect on navigation or later saves. Omitting it propagates the
 *   `StackPersistenceSaveError` as an asynchronous error instead of
 *   consuming it silently.
 */
export type StackPersistenceErrorHandlers = {
  onLoadError?: (args: {
    error: StackPersistenceLoadError | SnapshotLoadError;
    initialContext: unknown;
  }) => { policy: "recover" | "propagate" };
  onSaveError?: (args: { error: StackPersistenceSaveError }) => void;
};

type StackPersistencePluginBaseOptions<Metadata> =
  StackPersistenceErrorHandlers & {
    storage: StackSnapshotStorage<Metadata>;
  };

/**
 * Keeps a type parameter position out of inference (equivalent to the
 * TS 5.4 built-in `NoInfer`, spelled out so emitted declarations stay
 * readable on older TypeScript versions).
 */
type NoInferMetadata<Metadata> = [Metadata][Metadata extends unknown
  ? 0
  : never];

/**
 * One storage, at most one strategy. Without a strategy the storage's
 * metadata type is `undefined`; with a strategy, storage and strategy share
 * the single `Metadata` inferred from the options. The strategy is the sole
 * inference site for `Metadata`: inferring from the storage as well would
 * let TypeScript unite mismatched candidates into a union that method
 * bivariance then accepts, instead of rejecting the mismatch.
 */
export type StackPersistencePluginOptions<Metadata = undefined> =
  | (StackPersistencePluginBaseOptions<undefined> & {
      strategy?: undefined;
    })
  | (StackPersistencePluginBaseOptions<NoInferMetadata<Metadata>> & {
      strategy: StackSnapshotStrategy<Metadata>;
    });

export function stackPersistencePlugin<Metadata = undefined>(
  options: StackPersistencePluginOptions<Metadata>,
): StackflowPlugin {
  throw new Error(
    "@stackflow/plugin-stack-persistence: stackPersistencePlugin is not implemented yet",
  );
}

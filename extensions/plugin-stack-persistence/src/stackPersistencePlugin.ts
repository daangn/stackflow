import type {
  SnapshotLoadError,
  StackflowActions,
  StackflowPlugin,
} from "@stackflow/core";
import { StackPersistenceLoadError, StackPersistenceSaveError } from "./errors";
import type { StackSnapshotRecord } from "./StackSnapshotRecord";
import type { StackSnapshotStorage } from "./StackSnapshotStorage";
import type { StackSnapshotStrategy } from "./StackSnapshotStrategy";

/**
 * Error handlers shared by every options shape.
 *
 * - `onLoadError` receives expected load failures (storage reads as
 *   `StackPersistenceLoadError`, core validation as core's own
 *   `SnapshotLoadError`, identity preserved) together with the start context,
 *   and answers the policy: `recover` abandons the snapshot and falls back to
 *   a fresh stack, `propagate` rethrows the very same error object. Omitting
 *   the handler defaults to `recover`.
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
  return () => {
    // The public options union proves that storage and strategy agree on one
    // metadata type. This normalized internal view keeps that proof at the
    // package boundary instead of leaking the union through every operation.
    const storage = options.storage as StackSnapshotStorage<
      Metadata | undefined
    >;
    const strategy = options.strategy as
      | StackSnapshotStrategy<Metadata>
      | undefined;

    let initialContext: unknown;
    let initialized = false;

    const applyLoadPolicy = (
      error: StackPersistenceLoadError | SnapshotLoadError,
      context: unknown,
    ): "recover" | "propagate" =>
      options.onLoadError?.({ error, initialContext: context }).policy ??
      "recover";

    const recoverFromPersistenceLoadError = (
      error: StackPersistenceLoadError,
      context: unknown,
    ): null => {
      if (applyLoadPolicy(error, context) === "propagate") {
        throw error;
      }

      return null;
    };

    const reportSaveError = (error: StackPersistenceSaveError): void => {
      if (options.onSaveError) {
        options.onSaveError({ error });
        return;
      }

      // Save failures never unwind navigation synchronously. With no handler,
      // a rejected promise transfers the error to the runtime's asynchronous
      // unhandled-error boundary instead of consuming or logging it.
      void Promise.reject(error);
    };

    const saveIfIdle = (actions: StackflowActions): void => {
      if (actions.getStack().globalTransitionState !== "idle") {
        return;
      }

      const snapshot = actions.captureSnapshot();
      let metadata: Metadata | undefined;

      if (strategy) {
        try {
          metadata = strategy.createMetadata({ snapshot, initialContext });
        } catch (detail) {
          reportSaveError(
            new StackPersistenceSaveError({ kind: "strategy", detail }),
          );
          return;
        }
      } else {
        metadata = undefined;
      }

      const record: StackSnapshotRecord<Metadata | undefined> = {
        snapshot,
        metadata,
      };

      // A synchronous throw violates StackSnapshotStorage's contract and is
      // intentionally left as an unexpected exception. Rejected promises are
      // the expected storage failure channel.
      const savePromise = storage.save(record);
      void savePromise.catch((detail: unknown) => {
        reportSaveError(
          new StackPersistenceSaveError({ kind: "storage", detail }),
        );
      });
    };

    return {
      key: "@stackflow/plugin-stack-persistence",

      provideSnapshot({ initialContext: context }) {
        initialContext = context;

        let record: StackSnapshotRecord<Metadata | undefined> | null;
        try {
          record = storage.load();
        } catch (detail) {
          return recoverFromPersistenceLoadError(
            new StackPersistenceLoadError({ detail }),
            context,
          );
        }

        if (record === null || !strategy) {
          return record?.snapshot ?? null;
        }

        return strategy.shouldReuse({
          record: record as StackSnapshotRecord<Metadata>,
          initialContext: context,
        })
          ? record.snapshot
          : null;
      },

      onLoadError({ error, initialContext: context }) {
        return { policy: applyLoadPolicy(error, context) };
      },

      onInit({ actions }) {
        initialized = true;
        saveIfIdle(actions);
      },

      onChanged({ actions }) {
        if (initialized) {
          saveIfIdle(actions);
        }
      },
    };
  };
}

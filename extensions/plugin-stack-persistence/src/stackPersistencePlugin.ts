import type { StackflowActions, StackflowPlugin } from "@stackflow/core";
import {
  StackSnapshotMetadataParseError,
  StackSnapshotRecordLoadError,
  StackSnapshotRecordSaveError,
} from "./errors";
import type { StackSnapshotStorage } from "./StackSnapshotStorage";
import type { StackSnapshotStrategy } from "./StackSnapshotStrategy";

export type StackPersistencePluginOptions<Metadata> = {
  storage: StackSnapshotStorage<Metadata>;
  strategy: StackSnapshotStrategy<Metadata>;
  onRecordLoadError?: (error: StackSnapshotRecordLoadError) => void;
  onRecordSaveError?: (error: StackSnapshotRecordSaveError) => void;
  onLoadError?: NonNullable<ReturnType<StackflowPlugin>["onLoadError"]>;
};

export function stackPersistencePlugin<Metadata>({
  storage,
  strategy,
  onRecordLoadError,
  onRecordSaveError,
  onLoadError,
}: StackPersistencePluginOptions<Metadata>): StackflowPlugin {
  return () => {
    const saveIfIdle = (actions: StackflowActions) => {
      const stack = actions.getStack();

      if (stack.globalTransitionState !== "idle") return;

      const snapshot = actions.captureSnapshot();
      const metadata = strategy.metadata.create({ stack, snapshot });

      storage
        .save({
          snapshot,
          metadata,
        })
        .catch((error) => {
          const saveError = new StackSnapshotRecordSaveError(error);

          if (onRecordSaveError) return onRecordSaveError(saveError);
          else throw saveError;
        });
    };

    return {
      key: "@stackflow/plugin-stack-persistence",
      provideSnapshot({ initialContext }) {
        try {
          const record = storage.load();

          if (!record) return null;

          const parsedMetadata = strategy.metadata.parse(record.metadata);

          if (!parsedMetadata.ok) {
            throw new StackSnapshotMetadataParseError(parsedMetadata.detail);
          }

          const parsedRecord = {
            ...record,
            metadata: parsedMetadata.value,
          };

          if (!strategy.shouldReuse({ record: parsedRecord, initialContext })) {
            return null;
          }

          return parsedRecord.snapshot;
        } catch (error) {
          onRecordLoadError?.(new StackSnapshotRecordLoadError(error));

          return null;
        }
      },
      onLoadError(...args) {
        return onLoadError?.(...args) ?? { policy: "recover" };
      },
      onInit({ actions }) {
        saveIfIdle(actions);
      },
      onChanged({ actions }) {
        saveIfIdle(actions);
      },
    };
  };
}

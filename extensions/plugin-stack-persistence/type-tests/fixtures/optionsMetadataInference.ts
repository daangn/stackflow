/**
 * Contract: with a strategy, storage and strategy share one `Metadata`
 * inferred from the options without an explicit generic; mismatched
 * combinations are rejected.
 */
import type { StackflowPlugin } from "@stackflow/core";
import type {
  StackSnapshotStorage,
  StackSnapshotStrategy,
} from "@stackflow/plugin-stack-persistence";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";

declare const plainStorage: StackSnapshotStorage;
declare const verStorage: StackSnapshotStorage<{ version: number }>;
declare const verStrategy: StackSnapshotStrategy<{ version: number }>;
declare const tagStrategy: StackSnapshotStrategy<{ tag: string }>;

// Positive: the matching pair infers Metadata with no explicit generic.
export const inferred: StackflowPlugin = stackPersistencePlugin({
  storage: verStorage,
  strategy: verStrategy,
});

// @ts-expect-error 서로 다른 metadata의 storage/strategy 조합은 거부된다
stackPersistencePlugin({ storage: verStorage, strategy: tagStrategy });

// @ts-expect-error strategy만 metadata를 갖고 storage가 맞지 않으면 거부된다
stackPersistencePlugin({ storage: plainStorage, strategy: verStrategy });

import type { StackSnapshot } from "@stackflow/core";
import type {
  StackSnapshotRecord,
  StackSnapshotStrategy,
} from "@stackflow/plugin-stack-persistence";

export type CreateMetadataCall = {
  snapshot: StackSnapshot;
  initialContext: unknown;
};

export type ShouldReuseCall<Metadata> = {
  record: Readonly<StackSnapshotRecord<Metadata>>;
  initialContext: unknown;
};

export type StrategySpy<Metadata> = {
  strategy: StackSnapshotStrategy<Metadata>;
  createMetadataCalls: CreateMetadataCall[];
  shouldReuseCalls: ShouldReuseCall<Metadata>[];
};

/**
 * Strategy test double that records every call (arguments by reference)
 * and its position in the shared call-order log.
 *
 * Passing `"forbidden"` for a method arms a trap: the call is still
 * logged — so order assertions expose it — and it throws immediately,
 * so a phase that must never invoke that method (`createMetadata` during
 * load, `shouldReuse` during save) fails fast instead of silently
 * succeeding.
 */
export function makeStrategySpy<Metadata>(options: {
  createMetadata: ((args: CreateMetadataCall) => Metadata) | "forbidden";
  shouldReuse: ((args: ShouldReuseCall<Metadata>) => boolean) | "forbidden";
  /** Shared log; entries are `strategy.createMetadata` / `strategy.shouldReuse`. */
  callLog?: string[];
}): StrategySpy<Metadata> {
  const createMetadataCalls: CreateMetadataCall[] = [];
  const shouldReuseCalls: ShouldReuseCall<Metadata>[] = [];

  const strategy: StackSnapshotStrategy<Metadata> = {
    createMetadata(args) {
      createMetadataCalls.push(args);
      options.callLog?.push("strategy.createMetadata");

      if (options.createMetadata === "forbidden") {
        throw new Error(
          "harness trap: createMetadata must not be called in this phase",
        );
      }

      return options.createMetadata(args);
    },
    shouldReuse(args) {
      shouldReuseCalls.push(args);
      options.callLog?.push("strategy.shouldReuse");

      if (options.shouldReuse === "forbidden") {
        throw new Error(
          "harness trap: shouldReuse must not be called in this phase",
        );
      }

      return options.shouldReuse(args);
    },
  };

  return { strategy, createMetadataCalls, shouldReuseCalls };
}

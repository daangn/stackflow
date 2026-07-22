import type { StackSnapshotStrategy } from "./StackSnapshotStrategy";

type StrategiesMetadata<
  Strategies extends Record<string, StackSnapshotStrategy<unknown>>,
> = {
  [Key in keyof Strategies]: Strategies[Key] extends StackSnapshotStrategy<
    infer Metadata
  >
    ? Metadata
    : never;
};

function isMetadataRecord(
  metadata: unknown,
): metadata is Record<string, unknown> {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    !Array.isArray(metadata)
  );
}

export function composeStrategies<
  Strategies extends Record<string, StackSnapshotStrategy<unknown>>,
>(
  strategies: Strategies,
): StackSnapshotStrategy<StrategiesMetadata<Strategies>> {
  const keys = Object.keys(strategies) as Array<keyof Strategies>;

  return {
    createMetadata(args) {
      return Object.fromEntries(
        keys.map((key) => [key, strategies[key].createMetadata(args)]),
      ) as StrategiesMetadata<Strategies>;
    },
    shouldReuse({ record, initialContext }) {
      if (!isMetadataRecord(record.metadata)) return false;
      if (!keys.every((key) => Object.hasOwn(record.metadata, key))) {
        return false;
      }

      return keys.every((key) => {
        return strategies[key].shouldReuse({
          record: {
            ...record,
            metadata: record.metadata[key],
          },
          initialContext,
        });
      });
    },
  };
}

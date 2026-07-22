import type { StackSnapshotStrategy } from "./StackSnapshotStrategy";

export type StrategiesMetadata<
  Strategies extends Record<string, StackSnapshotStrategy<any>>,
> = {
  [Key in keyof Strategies]: Strategies[Key] extends StackSnapshotStrategy<
    infer Metadata
  >
    ? Metadata
    : never;
};

function isComposedStrategyMetadata<Metadata>(
  metadata: unknown,
): metadata is ComposedStrategyMetadata<Metadata> {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    'key' in metadata &&
    metadata['key'] === 'composed-strategy-metadata-v1'
  );
}

export interface ComposedStrategyMetadata<Metadata> {
  key: 'composed-strategy-metadata-v1'
  composed: Metadata;
}

export function composeStrategies<
  const Strategies extends Record<string, StackSnapshotStrategy<any>>,
>(
  strategies: Strategies,
): StackSnapshotStrategy<ComposedStrategyMetadata<StrategiesMetadata<Strategies>>> {
  const keys = Object.keys(strategies) as Array<keyof Strategies>;

  return {
    createMetadata(args) {
      return {
        key: 'composed-strategy-metadata-v1',
        composed: Object.fromEntries(
          keys.map((key) => [key, strategies[key].createMetadata(args)]),
        ) as StrategiesMetadata<Strategies>
      }
    },
    shouldReuse({ record, initialContext }) {
      if (!isComposedStrategyMetadata(record.metadata)) return false;
      if (!keys.every((key) => Object.hasOwn(record.metadata, key))) {
        return false;
      }

      return keys.every((key) => {
        return strategies[key].shouldReuse({
          record: {
            ...record,
            metadata: record.metadata.composed[key],
          },
          initialContext,
        });
      });
    },
  };
}

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

export interface ComposeStrategiesMetadata<Metadata> {
  schema: 'compose-strategy',
  version: 1,
  composed: Metadata;
}

export function composeStrategies<
  const Strategies extends Record<string, StackSnapshotStrategy<any>>,
>(
  strategies: Strategies,
): StackSnapshotStrategy<ComposeStrategiesMetadata<StrategiesMetadata<Strategies>>> {
  const keys = Object.keys(strategies) as Array<keyof Strategies>;

  return {
    createMetadata(args) {
      return {
        schema: 'compose-strategy',
        version: 1,
        composed: Object.fromEntries(
          keys.map((key) => [key, strategies[key].createMetadata(args)]),
        ) as StrategiesMetadata<Strategies>
      }
    },
    shouldReuse({ record, initialContext }) {
      if (!keys.every((key) => Object.hasOwn(record.metadata.composed, key))) {
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

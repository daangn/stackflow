import type { StackSnapshotStrategy } from "./StackSnapshotStrategy";

export type StrategiesMetadata<
  Strategies extends Record<string, StackSnapshotStrategy<any>>,
> = {
  [Key in keyof Strategies]: ReturnType<Strategies[Key]["metadata"]["create"]>;
};

export function composeStrategies<
  const Strategies extends Record<string, StackSnapshotStrategy<any>>,
>(
  strategies: Strategies,
): StackSnapshotStrategy<StrategiesMetadata<Strategies>> {
  const keys = Object.keys(strategies) as Array<keyof Strategies>;

  return {
    metadata: {
      create(args) {
        return Object.fromEntries(
          keys.map((key) => [key, strategies[key].metadata.create(args)]),
        ) as StrategiesMetadata<Strategies>;
      },
      parse(data) {
        if (data === null || typeof data !== "object") {
          return { ok: false };
        }

        const metadata = data as Record<PropertyKey, unknown>;
        const parsedEntries: Array<[PropertyKey, unknown]> = [];

        for (const key of keys) {
          if (!Object.hasOwn(metadata, key)) {
            return { ok: false };
          }

          const result = strategies[key].metadata.parse(metadata[key]);

          if (!result.ok) {
            return { ok: false };
          }

          parsedEntries.push([key, result.value]);
        }

        return {
          ok: true,
          value: Object.fromEntries(
            parsedEntries,
          ) as StrategiesMetadata<Strategies>,
        };
      },
    },
    shouldReuse({ record, initialContext }) {
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

import type { StackSnapshotStrategy } from "./StackSnapshotStrategy";

const COMPOSED_METADATA_SCHEMA = "stackflow.compose-strategies";
const COMPOSED_METADATA_VERSION = 1;

type StrategiesMetadataData<
  Strategies extends Record<string, StackSnapshotStrategy<any>>,
> = {
  [Key in keyof Strategies]: ReturnType<Strategies[Key]["metadata"]["create"]>;
};

export type StrategiesMetadata<
  Strategies extends Record<string, StackSnapshotStrategy<any>>,
> = {
  readonly schema: typeof COMPOSED_METADATA_SCHEMA;
  readonly version: typeof COMPOSED_METADATA_VERSION;
  readonly data: StrategiesMetadataData<Strategies>;
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
        return {
          schema: COMPOSED_METADATA_SCHEMA,
          version: COMPOSED_METADATA_VERSION,
          data: Object.fromEntries(
            keys.map((key) => [key, strategies[key].metadata.create(args)]),
          ),
        } as StrategiesMetadata<Strategies>;
      },
      parse(data) {
        if (data === null || typeof data !== "object") {
          return { ok: false };
        }

        const metadata = data as Record<PropertyKey, unknown>;

        if (
          !Object.hasOwn(metadata, "schema") ||
          !Object.hasOwn(metadata, "version") ||
          !Object.hasOwn(metadata, "data") ||
          metadata.schema !== COMPOSED_METADATA_SCHEMA ||
          metadata.version !== COMPOSED_METADATA_VERSION ||
          metadata.data === null ||
          typeof metadata.data !== "object"
        ) {
          return { ok: false };
        }

        const metadataData = metadata.data as Record<PropertyKey, unknown>;

        if (
          Object.keys(metadataData).length !== keys.length ||
          !keys.every((key) => Object.hasOwn(metadataData, key))
        ) {
          return { ok: false };
        }

        const parsedEntries: Array<[PropertyKey, unknown]> = [];

        for (const key of keys) {
          const result = strategies[key].metadata.parse(metadataData[key]);

          if (!result.ok) {
            return { ok: false };
          }

          parsedEntries.push([key, result.value]);
        }

        return {
          ok: true,
          value: {
            schema: COMPOSED_METADATA_SCHEMA,
            version: COMPOSED_METADATA_VERSION,
            data: Object.fromEntries(parsedEntries),
          } as StrategiesMetadata<Strategies>,
        };
      },
    },
    shouldReuse({ record, initialContext }) {
      return keys.every((key) => {
        return strategies[key].shouldReuse({
          record: {
            ...record,
            metadata: record.metadata.data[key],
          },
          initialContext,
        });
      });
    },
  };
}

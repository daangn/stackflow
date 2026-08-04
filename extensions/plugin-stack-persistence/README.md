# @stackflow/plugin-stack-persistence

Applications often need to preserve a user's navigation context across a page
reload or JavaScript runtime replacement.

`@stackflow/plugin-stack-persistence` saves a complete Stackflow snapshot and
restores it when the stack starts again. The package is framework-neutral and
leaves the storage medium, serialization, record lifetime, and reuse policy to
your application.

## Installation

```bash
yarn add @stackflow/plugin-stack-persistence
```

## Setup

Add `stackPersistencePlugin()` to your Stackflow configuration with a storage
and reuse strategy:

```typescript
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { stackflow } from "@stackflow/react";
import { ArticleActivity } from "./ArticleActivity";
import { HomeActivity } from "./HomeActivity";
import { snapshotStorage, snapshotStrategy } from "./persistence";
import { config } from "./stackflow.config";

const { Stack } = stackflow({
  config,
  components: {
    HomeActivity,
    ArticleActivity,
  },
  plugins: [
    stackPersistencePlugin({
      storage: snapshotStorage,
      strategy: snapshotStrategy,
    }),
  ],
});
```

## Usage

The storage must provide a synchronous loader and an asynchronous saver. The
strategy validates stored metadata and decides whether its snapshot can be
reused.

The following example stores snapshots in `localStorage`, rejects records from
another application version, and expires records after seven days:

```typescript
import type {
  StackSnapshotRecord,
  StackSnapshotStorage,
  StackSnapshotStrategy,
} from "@stackflow/plugin-stack-persistence";

const STORAGE_KEY = "stackflow.snapshot";
const APP_VERSION = 1 as const;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

type SnapshotMetadata = {
  appVersion: number;
  savedAt: number;
};

export const snapshotStorage: StackSnapshotStorage<SnapshotMetadata> = {
  load() {
    if (typeof window === "undefined") return null;

    const serialized = window.localStorage.getItem(STORAGE_KEY);

    return serialized === null
      ? null
      : (JSON.parse(serialized) as StackSnapshotRecord<unknown>);
  },
  async save(record) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  },
};

export const snapshotStrategy: StackSnapshotStrategy<SnapshotMetadata> = {
  metadata: {
    create() {
      return {
        appVersion: APP_VERSION,
        savedAt: Date.now(),
      };
    },
    parse(data) {
      if (
        data === null ||
        typeof data !== "object" ||
        !("appVersion" in data) ||
        typeof data.appVersion !== "number" ||
        !("savedAt" in data) ||
        typeof data.savedAt !== "number"
      ) {
        return {
          ok: false,
          detail: "invalid snapshot metadata",
        };
      }

      return {
        ok: true,
        value: {
          appVersion: data.appVersion,
          savedAt: data.savedAt,
        },
      };
    },
  },
  shouldReuse({ record }) {
    return (
      record.metadata.appVersion === APP_VERSION &&
      Date.now() - record.metadata.savedAt < MAX_AGE_MS
    );
  },
};
```

## Behavior

### Restoring a snapshot

The plugin attempts to restore a record while the stack is being created. It
restores the snapshot only when the record is present, its metadata is valid,
the strategy accepts it for reuse, and Stackflow can load the snapshot with the
current configuration.

Restoration is synchronous. If the backing store has an asynchronous read API,
prepare its record before creating the stack. Return `null` when no prepared
record is available, including in environments where the chosen storage cannot
be accessed.

### Error handling

| Condition | Result |
| --- | --- |
| No record is available | Stackflow starts with its normal initial stack. |
| The storage cannot load the record or its metadata is invalid | Stackflow starts with its normal initial stack. An optional callback can observe the failure. |
| The strategy rejects the record | Stackflow starts with its normal initial stack without reporting an error. |
| Stackflow cannot load the accepted snapshot | The plugin recovers with the normal initial stack by default. Applications can choose to propagate the error and abort stack creation. |
| Saving the record fails | An optional callback handles the failure; without one, the plugin rethrows the wrapped promise rejection. |

### Storage and strategy requirements

- `storage.load()` must return a complete record or `null` synchronously.
- `storage.save()` must return a `Promise<void>`. Save requests can overlap, so
  asynchronous storage must prevent an older request from overwriting a newer
  record.
- Storage owns serialization. Its codec must round-trip the snapshot and
  metadata values produced by the application.
- `metadata.parse()` must treat loaded metadata as untrusted input and return
  `{ ok: false }` for malformed data.
- `shouldReuse()` must return `false` for valid records that should not be used
  in the current application context, such as incompatible or expired records.
- Strategy callbacks are synchronous. Expected metadata or reuse rejection
  should use a failed parse result or `false` instead of throwing.

## API

### `stackPersistencePlugin()`

```typescript
function stackPersistencePlugin<Metadata>(
  options: StackPersistencePluginOptions<Metadata>,
): StackflowPlugin;
```

Creates a Stackflow core plugin.

| Option | Description |
| --- | --- |
| `storage` | Required `StackSnapshotStorage<Metadata>` implementation. |
| `strategy` | Required `StackSnapshotStrategy<Metadata>` implementation. |
| `onRecordLoadError` | Receives storage-load and metadata-parse errors before startup continues with the initial stack. |
| `onRecordSaveError` | Handles storage-save rejections. Without a handler, the wrapped rejection is rethrown. |
| `onLoadError` | Chooses whether to recover from or propagate a core snapshot-load error. Defaults to recovery. |

The options type is exported as `StackPersistencePluginOptions`.

Only one Stackflow plugin can provide a non-null snapshot during stack
creation. If this plugin accepts a record while another plugin also provides a
snapshot, core rejects the conflicting configuration.

### Storage and record types

```typescript
interface StackSnapshotStorage<Metadata> {
  load(): StackSnapshotRecord<unknown> | null;
  save(record: StackSnapshotRecord<Metadata>): Promise<void>;
}

type StackSnapshotRecord<Metadata> = {
  snapshot: StackSnapshot;
  metadata: Metadata;
};
```

Loaded metadata is deliberately `unknown`; the strategy must validate it before
the plugin can use the record.

### Strategy types

```typescript
interface StackSnapshotMetadataDefinition<Metadata> {
  create(args: { stack: Stack; snapshot: StackSnapshot }): Metadata;
  parse(data: unknown): Result<Metadata>;
}

interface StackSnapshotStrategy<Metadata> {
  metadata: StackSnapshotMetadataDefinition<Metadata>;
  shouldReuse(args: {
    record: StackSnapshotRecord<Metadata>;
    initialContext: unknown;
  }): boolean;
}

type Result<Value> =
  | { ok: true; value: Value }
  | { ok: false; detail?: unknown };
```

`metadata.create()` produces metadata for new records. `metadata.parse()` is
the only boundary that promotes loaded `unknown` data to `Metadata`, and
`shouldReuse()` decides whether a successfully parsed record is compatible with
the current `initialContext`. Direct exceptions from `metadata.parse()` or
`shouldReuse()` propagate during stack creation.

### `composeStrategies()`

```typescript
function composeStrategies<
  const Strategies extends Record<string, StackSnapshotStrategy<any>>,
>(
  strategies: Strategies,
): StackSnapshotStrategy<StrategiesMetadata<Strategies>>;
```

Combines keyed strategies into another `StackSnapshotStrategy`. The composed
strategy can be passed to `stackPersistencePlugin()` without special setup,
and its inferred metadata envelope type is exported as `StrategiesMetadata`.
Every child parser and reuse predicate must succeed. Adding, removing, or
renaming a strategy key makes previously composed metadata invalid.

### Error classes

- `StackSnapshotRecordLoadError` — exposes the thrown storage value as `cause`.
- `StackSnapshotMetadataParseError` — exposes the parser failure detail as
  `detail`.
- `StackSnapshotRecordSaveError` — exposes the rejected storage value as
  `cause`.

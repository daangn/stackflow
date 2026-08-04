# @stackflow/plugin-stack-persistence

Persist a Stackflow navigation snapshot beyond the lifetime of the JavaScript
runtime and restore it when the stack starts again. The package is
framework-neutral: it uses the `@stackflow/core` plugin contract and leaves the
storage medium, serialization, record lifetime, and reuse policy to your
application.

## Installation

```bash
yarn add @stackflow/plugin-stack-persistence
```

This package requires `@stackflow/core` 3.x.

## Setup

Create a synchronous loader, an asynchronous saver, and a strategy that
validates stored metadata and decides whether its snapshot can be reused.

The following example stores snapshots in `localStorage`, rejects records from
another application version, and expires records after seven days:

```typescript
import type {
  StackSnapshotRecord,
  StackSnapshotStorage,
  StackSnapshotStrategy,
} from "@stackflow/plugin-stack-persistence";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";

const STORAGE_KEY = "stackflow.snapshot";
const APP_VERSION = 1 as const;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

type SnapshotMetadata = {
  appVersion: typeof APP_VERSION;
  savedAt: number;
};

const storage: StackSnapshotStorage<SnapshotMetadata> = {
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

const strategy: StackSnapshotStrategy<SnapshotMetadata> = {
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
        data.appVersion !== APP_VERSION ||
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
          appVersion: APP_VERSION,
          savedAt: data.savedAt,
        },
      };
    },
  },
  shouldReuse({ record }) {
    return Date.now() - record.metadata.savedAt < MAX_AGE_MS;
  },
};

export const persistencePlugin = stackPersistencePlugin({
  storage,
  strategy,
  onRecordLoadError(error) {
    console.warn("Could not read the saved Stackflow snapshot", error);
  },
  onRecordSaveError(error) {
    console.error("Could not save the Stackflow snapshot", error);
  },
});
```

Add the plugin to an existing Stackflow configuration:

```typescript
import { stackflow } from "@stackflow/react";
import { ArticleActivity } from "./ArticleActivity";
import { HomeActivity } from "./HomeActivity";
import { persistencePlugin } from "./persistence";
import { config } from "./stackflow.config";

const { Stack } = stackflow({
  config,
  components: {
    HomeActivity,
    ArticleActivity,
  },
  plugins: [persistencePlugin],
});
```

## Behavior

### Restoring a snapshot

Stackflow calls `storage.load()` synchronously while creating the stack. When a
record is present, the plugin:

1. passes its untrusted `metadata` through `strategy.metadata.parse()`;
2. passes the parsed record and Stackflow's `initialContext` to
   `strategy.shouldReuse()`; and
3. provides the snapshot to Stackflow when the strategy returns `true`.

Returning `null` from `storage.load()`, returning `false` from `shouldReuse()`,
or returning `{ ok: false }` from `metadata.parse()` causes Stackflow to use its
normal initial stack. A thrown `storage.load()` error has the same fallback and
is reported as `StackSnapshotRecordLoadError` through `onRecordLoadError`.
Metadata parse failures are reported as `StackSnapshotMetadataParseError`.

After the plugin accepts a record, core still validates and replays its
snapshot against the current Stackflow configuration. `onLoadError` controls
what happens when that step fails:

```typescript
stackPersistencePlugin({
  storage,
  strategy,
  onLoadError({ error, initialContext }) {
    reportSnapshotError(error, initialContext);

    return { policy: "propagate" };
  },
});
```

The default policy is `{ policy: "recover" }`, which discards the unusable
snapshot and creates the normal initial stack. Return `{ policy: "propagate" }`
to let the core `SnapshotLoadError` abort stack creation.

`storage.load()`, metadata parsing, the reuse decision, and snapshot loading
are all synchronous. Prepare data before creating the stack when the backing
store has an asynchronous read API. In server environments, return `null` when
the chosen storage is unavailable, as in the example above.

### Saving snapshots

The plugin captures a record during stack initialization and after stack
changes, but calls `storage.save()` only when `globalTransitionState` is
`"idle"`. Each record contains the complete core snapshot and metadata created
from the same current `Stack` and `StackSnapshot`. The `metadata.create()`
callback receives both values.

`storage.save()` runs asynchronously and does not block navigation. The plugin
does not wait for an earlier save before starting a later one, so storage backed
by asynchronous I/O must prevent an older request from overwriting a newer
record. A rejected save is wrapped in `StackSnapshotRecordSaveError` and sent
to `onRecordSaveError`. Without a handler, the wrapped error is rethrown from
the promise rejection.

The storage owns serialization. Ensure that the selected codec can represent
the values carried by your application's snapshot events and metadata.

### Composing reuse policies

Use `composeStrategies()` when a record must satisfy several independent reuse
policies:

```typescript
import { composeStrategies } from "@stackflow/plugin-stack-persistence";

const strategy = composeStrategies({
  appVersion: appVersionStrategy,
  session: sessionStrategy,
});
```

The composed strategy stores a versioned metadata envelope. On load, it
requires exactly the same strategy keys, parses each strategy's metadata, and
reuses the snapshot only when every `shouldReuse()` call returns `true`.

## Error handling

- `onRecordLoadError` receives `StackSnapshotRecordLoadError` when
  `storage.load()` throws and `StackSnapshotMetadataParseError` when
  `metadata.parse()` returns `{ ok: false }`. In both cases, startup falls back
  to the normal initial stack.
- `onLoadError` receives core `SnapshotLoadError` values for snapshots that
  cannot be loaded with the current configuration. It recovers by default.
- `onRecordSaveError` receives `StackSnapshotRecordSaveError` when the promise
  returned by `storage.save()` rejects.

The error wrappers expose the original value as `cause` for record load/save
errors and as `detail` for metadata parse errors. Exceptions thrown directly by
`metadata.parse()` or `shouldReuse()` are outside these recovery callbacks and
propagate during stack creation. Return `{ ok: false, detail }` or `false` for
expected rejection paths.

## Public API

### `stackPersistencePlugin(options)`

Creates a Stackflow core plugin. `options` contains:

- `storage` — required `StackSnapshotStorage<Metadata>` implementation;
- `strategy` — required `StackSnapshotStrategy<Metadata>` implementation;
- `onRecordLoadError` — optional storage-load and metadata-parse error handler;
- `onRecordSaveError` — optional save-rejection handler; and
- `onLoadError` — optional core snapshot-load policy handler.

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

`composeStrategies()` returns another `StackSnapshotStrategy`, so composed
strategies can be passed to `stackPersistencePlugin()` without special setup.
The inferred envelope type is exported as `StrategiesMetadata`.

### Error classes

- `StackSnapshotRecordLoadError` — exposes the thrown storage value as `cause`.
- `StackSnapshotMetadataParseError` — exposes the parser failure detail as
  `detail`.
- `StackSnapshotRecordSaveError` — exposes the rejected storage value as
  `cause`.

# @stackflow/plugin-stack-persistence

Persist Stackflow's navigation context beyond the lifetime of the JavaScript
runtime, and restore the full context as the initial stack on the next start.

- Framework-neutral: uses only the `@stackflow/core` plugin contract. No React
  components, hooks, or Context.
- Storage is injected by the consumer (`StackSnapshotStorage`): synchronous
  prepared `load()`, asynchronous `save()` returning `Promise<void>`. Media
  choice, encoding, namespacing, and record lifetime are the storage's
  responsibility.
- An optional `StackSnapshotStrategy` attaches opaque metadata to each saved
  record and decides synchronously whether a stored record is reused for this
  start.
- `storage.load()` failures can be recovered through `onStorageLoadError` by
  returning a replacement record or `null`; otherwise the original error is
  propagated. Core snapshot validation failures use `onLoadError` (`recover`
  by default, `propagate` opt-in). Save failures use `onSaveError` and never
  interfere with navigation.

```ts
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";

stackflow({
  // ...
  plugins: [
    stackPersistencePlugin({
      storage: myStorage,
    }),
  ],
});
```

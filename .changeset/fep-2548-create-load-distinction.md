---
"@stackflow/core": minor
---

Distinguish how a stack is created — freshly (`create`) or restored from a snapshot (`load`) — and add the surface a snapshot round-trip (capture → persist → load) needs, entirely through additive plugin contracts. A store with no snapshot provider behaves exactly as before.

- `StackSnapshot` (and the `NavigationEvent` union) — a plain-data value, owned by core, that carries only navigation events. Encoding to a persistence medium (codec) is the consumer's responsibility.
- `actions.captureSnapshot()` — capture the current navigation history as a snapshot; callable from any hook, at any time.
- `provideSnapshot?(({ initialContext }))` plugin hook — called synchronously at creation time to supply a snapshot to load from. Returning `null`/`undefined` keeps the create path. If more than one plugin supplies a snapshot, core throws a creation error naming the conflicting keys rather than arbitrating.
- `onLoadError?(({ error, initialContext }))` plugin hook + `SnapshotLoadError` (with a `cause` of `incompatible-schema`, `invalid-events`, or `empty-navigation`) — a failed load is routed only to the plugin that provided the snapshot. Returning `{ recover: "create" }` resumes the create path; returning nothing (or having no handler) throws the error out of `makeCoreStore`.
- `onInit` now receives `initializedBy: "create" | "load"` — a one-shot signal that leaves no trace on the stack state or event log.

```ts
const persisterPlugin = ({ storage, codec }) => () => ({
  key: "persister",
  onChanged({ actions }) {
    storage.write(codec.encode(actions.captureSnapshot()));
  },
  provideSnapshot() {
    const raw = storage.read();
    return raw ? codec.decode(raw) : null;
  },
  onLoadError({ error }) {
    storage.remove();
    return { recover: "create" };
  },
});
```

A load reconstructs the stack by replaying the snapshot's navigation events through the existing aggregate machinery: it re-derives static information (transition duration, the registered-activity set) from the current config, re-dates the events so the restored stack settles synchronously, and preserves each event's `id`/`activityId`/`stepId` byte-for-byte. No new domain events or stack state properties are introduced.

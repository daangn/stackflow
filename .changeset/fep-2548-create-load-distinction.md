---
"@stackflow/core": minor
---

Distinguish how a stack is created — freshly (`create`) or restored from a snapshot (`load`) — and add the surface a snapshot round-trip (capture → persist → load) needs, through additive plugin contracts. The addition is runtime-additive — a store with no snapshot provider behaves exactly as before — but at the type level, hand-written `StackflowActions` mocks and code that constructs `onInit` hook arguments (wrap-and-forward plugins) must add the new required members (`captureSnapshot`, `initInfo`).

- `StackSnapshot` (and the `NavigationEvent` union) — a plain-data value, owned by core, that carries only navigation events. Encoding to a persistence medium (codec) is the consumer's responsibility.
- `actions.captureSnapshot()` — capture the current navigation history as a snapshot; callable from any hook, at any time.
- `provideSnapshot?({ initialContext })` plugin hook — called synchronously at creation time to supply a snapshot to load from. Returning `null`/`undefined` keeps the create path. If more than one plugin supplies a snapshot, core throws a creation error naming the conflicting keys rather than arbitrating.
- `onLoadError?({ error, initialContext })` plugin hook + `SnapshotLoadError` (with a `cause.kind` of `"unrecognized-snapshot"`, `"incompatible-events"`, or `"empty-stack"`) — a failed load is routed only to the plugin that provided the snapshot. Returning `{ recover: "create" }` resumes the create path; returning nothing (or having no handler) throws the error out of `makeCoreStore`.
- `onInit` now receives `initInfo: { kind: "create" | "load" }` — a one-shot signal that leaves no trace on the stack state or event log. It is a record rather than a bare string so per-path fields can be added later without breaking the hook signature.

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

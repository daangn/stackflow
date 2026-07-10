---
"@stackflow/core": minor
---

Distinguish how a stack is created — freshly (`create`) or restored from a snapshot (`load`) — and add the surface a snapshot round-trip (capture → persist → load) needs, through additive plugin contracts. The addition is runtime-additive — a store with no snapshot provider behaves exactly as before — but at the type level, hand-written `StackflowActions` mocks and code that constructs `onInit` hook arguments (wrap-and-forward plugins) must add the new required members (`captureSnapshot`, `initInfo`), and `overrideInitialEvents` implementations that explicitly annotate their parameter with the previous `(PushedEvent | StepPushedEvent)[]` shape must widen it to `SnapshotEvent[]` (implementations with inferred parameters are unaffected).

- `StackSnapshot` (and the `SnapshotEvent` union) — a plain-data value, owned by core, that carries every event the stack recorded at runtime — the six navigation events plus `Paused`/`Resumed` — excluding only the static events (`Initialized`, `ActivityRegistered`), which are config-grade information the current config re-derives at load time. Encoding to a persistence medium (codec) is the consumer's responsibility.
- `actions.captureSnapshot()` — export the recorded event log as-is (statics excluded); callable from any hook, at any time. Core holds no opinion about when a snapshot is meaningful: capturing a paused stack yields a snapshot that restores a paused stack, and whether to capture at such a moment is the caller's timing choice.
- `provideSnapshot?({ initialContext })` plugin hook — called synchronously at creation time to supply a snapshot to load from. Returning `null`/`undefined` keeps the create path. If more than one plugin supplies a snapshot, core throws a creation error naming the conflicting keys rather than arbitrating.
- `onLoadError?({ error, initialContext })` plugin hook + `SnapshotLoadError` (with a `cause.kind` of `"unrecognized-snapshot"`, `"incompatible-events"`, or `"empty-stack"`) — a failed load is routed only to the plugin that provided the snapshot. Returning `{ recover: "create" }` resumes the create path; returning nothing (or having no handler) throws the error out of `makeCoreStore`.
- `onInit` now receives `initInfo: { kind: "create" | "load" }` — a one-shot signal that leaves no trace on the stack state or event log. It is a record rather than a bare string so per-path fields can be added later without breaking the hook signature.
- `overrideInitialEvents` now runs on the load path too, and its signature widens to `SnapshotEvent[]` in and out, with a new `initInfo` argument (the same record `onInit` receives). On create it keeps deciding the initial entries, as before. On load it receives the provided snapshot's full replay sequence (`Paused`/`Resumed` included when the snapshot recorded them), and its return is adopted as the replay sequence with its event dates preserved — core never re-dates it, so a guarantee like "every restored activity is settled" is this hook's to provide by re-dating the events itself. The return then runs through the same load validation as the snapshot itself, so a failing return surfaces as a `SnapshotLoadError` to the provider. Reshaping the sequence reshapes the reconstructed navigation history: a plugin with no load policy must return `initialEvents` unchanged, and plugins written before this signal that fabricate initial events (e.g. from a URL) should early-return on `initInfo.kind === "load"`.

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

A load reconstructs the stack by replaying the snapshot's events — as passed through the plugins' `overrideInitialEvents` chain — through the existing aggregate machinery, preserving them byte-for-byte, `eventDate` included: the recorded dates are the replay truth, so a stack captured mid-transition restores mid-transition and a paused stack restores paused, and capture∘load is an identity on the snapshot events. Static information (transition duration, the registered-activity set) is re-derived from the current config, and only those static events are re-dated — to just before the earliest replayed event, so registration and transition duration are in place before any snapshot event applies. Core imposes no settling or date normalization on the replay; a supplier or plugin that wants a fully-settled restore (or protection from a capture clock that ran ahead) re-dates the sequence in `overrideInitialEvents`. No new domain events or stack state properties are introduced.

The snapshot load's registration check is unified into `validateEvents` (run by `aggregate` on every path), which now rejects a `Replaced` that materializes an unregistered activity, matching its long-standing check for `Pushed`. In config-first usage a replace only targets registered activities, so this added check does not fire on the live path.

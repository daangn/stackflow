---
"@stackflow/core": major
---

Distinguish how a stack is initialized — created fresh (`create`) or restored from a snapshot (`load`) — and add the surface a snapshot round-trip needs: `StackSnapshot`, `actions.captureSnapshot()`, the `provideSnapshot` / `onLoadError` plugin hooks, and `initInfo` on `onInit`. Runtime behavior is unchanged when no snapshot is provided; the breaks are type-level only — the `StackflowPluginHook` → `StackflowPluginInitHook` rename, plus new required members on `StackflowActions` and on the `onInit` / `overrideInitialEvents` hook signatures — hence the major.

**Added**

- `StackSnapshot` (with the `SnapshotEvent` / `NavigationEvent` unions) — a plain-data record of the events a stack recorded at runtime — plus `SnapshotLoadError`.
- `actions.captureSnapshot()` to export that record, and the `provideSnapshot` / `onLoadError` plugin hooks to supply a snapshot at creation time and route a failed load.
- `initInfo: { kind: "create" | "load" }` on `onInit`; `overrideInitialEvents` now runs on the load path too and receives the same `initInfo`.

**Changed**

- Renamed the `StackflowPluginHook` type to `StackflowPluginInitHook`.
- `StackflowActions` now requires `captureSnapshot`, the `onInit` / `overrideInitialEvents` hook arguments now require `initInfo`, and `overrideInitialEvents`' parameter widens from `(PushedEvent | StepPushedEvent)[]` to `SnapshotEvent[]` — hand-written mocks and wrap-and-forward plugins must adopt these.
- `validateEvents` now also rejects a `Replaced` that names an unregistered activity (does not fire in config-first usage).

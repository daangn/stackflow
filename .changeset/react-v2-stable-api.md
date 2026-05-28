---
"@stackflow/react": major
---

Promote Future API to the default entry point and remove the legacy Stable API.

- `@stackflow/react/future` and `@stackflow/react/stable` sub-paths removed. Import from `@stackflow/react` directly.
- `stackflow()` signature changed from `{ activities, transitionDuration }` to `{ config, components }`. Use `defineConfig()` from `@stackflow/config` for activity and route definitions.
- `useActions()` removed in favor of direct `useFlow()` imports, and `useStepActions()` removed in favor of direct `useStepFlow()` imports.
- `useActiveEffect()`, `useEnterDoneEffect()`, and `useStep()` are no longer exported from the default API.
- Step actions moved from `stackflow().actions` to the separate `stackflow().stepActions` object, with renamed methods: `stepPush` -> `pushStep`, `stepReplace` -> `replaceStep`, and `stepPop` -> `popStep`.
- `stackflow()` no longer returns the `activities` field, `useFlow`, `useStepFlow`, `addActivity`, or `addPlugin`. Hooks are now direct imports and activities are defined in `@stackflow/config`.
- `stackflow().actions` no longer exposes `getStack()` or `dispatchEvent()`; it now exposes only `push`, `replace`, and `pop`.
- `__internal__` directory removed; shared utilities are inlined into the main source.
- New default exports: `useLoaderData()`, `useConfig()`, `usePrepare()`, `lazy()`, and `structuredActivityComponent()`.
- `@stackflow/plugin-preload` package removed. Use `usePrepare()` from `@stackflow/react` instead; replace preload calls with `const prepare = usePrepare(); prepare(activityName, activityParams)`.
- Activity params now use `declare module "@stackflow/config" { interface Register { ... } }` instead of component props inference.

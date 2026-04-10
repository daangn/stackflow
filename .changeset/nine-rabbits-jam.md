---
"@stackflow/react": major
"@stackflow/link": major
"@stackflow/config": major
"@stackflow/core": major
---

Promote Future API to default entry point and remove legacy Stable API

**`@stackflow/react`**
- `@stackflow/react/future`, `@stackflow/react/stable` sub-paths removed. Import from `@stackflow/react` directly.
- `stackflow()` signature changed: `{ activities, transitionDuration }` → `{ config, components }`. Use `defineConfig()` from `@stackflow/config`.
- `useActions()` removed → `useFlow()`, `useStepActions()` removed → `useStepFlow()` (direct imports).
- Step actions renamed: `stepPush` → `pushStep`, `stepReplace` → `replaceStep`, `stepPop` → `popStep`.
- `stackflow()` no longer returns `useFlow` / `addActivity` / `addPlugin`. Hooks are now direct imports.
- `__internal__` directory removed; shared utilities inlined into main source.
- New default exports: `useLoaderData()`, `useConfig()`, `usePrepare()`, `lazy()`, `structuredActivityComponent()`.

**`@stackflow/link`**
- `@stackflow/link/future`, `@stackflow/link/stable` sub-paths removed. Import from `@stackflow/link` directly.
- `createLinkComponent()` removed. Use `import { Link } from "@stackflow/link"` directly.

**`@stackflow/config`, `@stackflow/core`** — Major version bump for ecosystem alignment. No API changes.

**Removed packages**
- `@stackflow/compat-await-push` — Use event-based patterns instead.
- `@stackflow/plugin-preload` — Use `usePrepare()` from `@stackflow/react` instead.
- `@stackflow/plugin-map-initial-activity` — Use `config.initialActivity` instead.

**Type system** — Activity params now declared via `declare module "@stackflow/config" { interface Register { ... } }` instead of component props inference.

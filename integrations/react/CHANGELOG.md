# @stackflow/react

## 1.5.0

### Minor Changes

- cfa7af8: Supports dynamic import for activities, and delays transition effects while loading an activity or waiting for a loader response
- 82b52b0: Add missing logics of considering `targetActivityId` while updating using update functions.
- cfa7af8: The 'update functions' pattern for step push and replace actions is implemented.
- cfa7af8: feat(core, react): add `hasZIndex` option in `useStepFlow()`

## 1.4.2

### Patch Changes

- e323ce3: fix: add `decode()` interface to `Config` and support `path: string[]`

## 1.4.1

### Patch Changes

- a4a7366: move `<StackProvider />` up so that `useStack()` can be used in `Plugin.wrapStack`

## 1.4.0

### Minor Changes

- 7b1780f: feat: Support `<Link />` in Future API
- 412de46: add `config` property in loader args

## 1.3.2

### Patch Changes

- 95f2ae8: chore(react): add typing for step action parameter
- 46ac359: fix: pass initial context to `<MainRenderer />`
- 46ac359: fix: create `initialContext` props in `<Stack />` component for SSR support

## 1.3.2-canary.1

### Patch Changes

- fix: pass initial context to `<MainRenderer />`

## 1.3.2-canary.0

### Patch Changes

- fix(plugin-history-sync): create `initialContext` props in `<Stack />` component for SSR support

## 1.3.1

### Patch Changes

- 1fc97b4: fix(react): specify .mjs extension for esm exports

## 1.3.0

### Minor Changes

- 667570b: feat(core,react): add `targetActivityId` option

### Patch Changes

- 667570b: feat(react): add `targetActivityId` param for future api

## 1.3.0-canary.1

### Patch Changes

- feat(react): add `targetActivityId` param for future api

## 1.3.0-canary.0

### Minor Changes

- feat(core,react): add `targetActivityId` option

### Patch Changes

- Updated dependencies
  - @stackflow/core@1.1.0-canary.0

## 1.2.2

### Patch Changes

- 5ac2798: [Future API] wrap loader return value with use() in useLoaderData()

## 1.2.1

### Patch Changes

- fc2061a: Change `stack()` to `stackflow()` in Future API

## 1.2.0

### Minor Changes

- 7df613a: change extension esm package .mjs to .js
- 7df613a: Change package to ESM Only
- 7df613a: support esm, cjs both
- 7df613a: Future API
- 7df613a: Future API
- 7df613a: Stackflow Config and Loader API (2.0 Candidate API with `/future` namespace)

## 1.2.0-canary.4

### Minor Changes

- change extension esm package .mjs to .js

## 1.2.0-canary.3

### Minor Changes

- support esm, cjs both

## 1.2.0-canary.2

### Minor Changes

- Change package to ESM Only

## 1.2.0-canary.1

### Minor Changes

- Future API

## 1.2.0-canary.0

### Minor Changes

- Future API

### Patch Changes

- Updated dependencies
  - @stackflow/config@1.0.1-canary.0

## 1.1.11

### Patch Changes

- 3e35026: chore: include declaration map

## 1.1.10

### Patch Changes

- edfffda: use Biome for lint instead of ESLint and fix fixable errors

## 1.1.9

### Patch Changes

- 27246ad7: fix(react): infer `BaseActivities` from given activities

## 1.1.8

### Patch Changes

- 6ad362f7: feat: add decode interface

## 1.1.8-canary.0

### Patch Changes

- feat: add decode interface

## 1.1.7

### Patch Changes

- a32a7e09: chore: bump patch version
- a32a7e09: fix(core)!: delegate overrideInitialEvents to makeCoreStore
- Updated dependencies [a32a7e09]
- Updated dependencies [a32a7e09]
  - @stackflow/core@1.0.10

## 1.1.7-canary.0

### Patch Changes

- fix(core)!: delegate overrideInitialEvents to makeCoreStore
- Updated dependencies
  - @stackflow/core@1.0.10-canary.0

## 1.1.6

### Patch Changes

- e4c49cdc: chore: apply new release system
- Updated dependencies [e4c49cdc]
  - @stackflow/core@1.0.9

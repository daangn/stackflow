# @stackflow/link

## 3.0.0

### Major Changes

- 8566b5e: Require Link consumers to provide a URL resolver through
  `LinkUrlResolverProvider`. This removes Link's direct dependency on
  `@stackflow/plugin-history-sync` and keeps generated URLs consistent with the
  configured routing plugin.

## 2.0.2

### Patch Changes

- aaf2d03: Expand the supported `@stackflow/core` peer dependency range to include both v2 and v3.

## 2.0.1

### Patch Changes

- Updated dependencies [f0fc1fb]
  - @stackflow/core@3.0.0

## 2.0.0

### Major Changes

- 273d45f: Promote Future API to the default entry point and remove the legacy Stable API.

  - `@stackflow/link/future` and `@stackflow/link/stable` sub-paths removed. Import from `@stackflow/link` directly.
  - `createLinkComponent()` removed. Use `import { Link } from "@stackflow/link"` directly.
  - `LinkProps.urlPatternOptions` removed. Link URL generation now uses `config.historySync.urlPatternOptions`.

### Patch Changes

- Updated dependencies [273d45f]
- Updated dependencies [273d45f]
- Updated dependencies [cef9c62]
  - @stackflow/core@2.0.0
  - @stackflow/react@2.0.0

## 1.6.1

### Patch Changes

- e323ce3: fix: add `decode()` interface to `Config` and support `path: string[]`

## 1.6.0

### Minor Changes

- db2aa80: feat(link): disable long press behavior in iOS

## 1.5.0

### Minor Changes

- 7b1780f: feat: Support `<Link />` in Future API
- 412de46: add `config` property in loader args

## 1.4.6-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/plugin-history-sync@1.6.4-canary.0
  - @stackflow/plugin-preload@1.4.3-canary.0

## 1.4.5

## 1.4.5-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.3.2-canary.0
  - @stackflow/plugin-history-sync@1.6.3-canary.0
  - @stackflow/plugin-preload@1.4.2-canary.0

## 1.4.4

## 1.4.4-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.3.0-canary.0
  - @stackflow/core@1.1.0-canary.0
  - @stackflow/plugin-history-sync@1.6.2-canary.0
  - @stackflow/plugin-preload@1.4.1-canary.0

## 1.4.3

## 1.4.3-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/plugin-history-sync@1.6.0-canary.0
  - @stackflow/react@1.2.0-canary.0
  - @stackflow/plugin-preload@1.3.3-canary.0

## 1.4.2

### Patch Changes

- 3e35026: chore: include declaration map

## 1.4.1

### Patch Changes

- edfffda: use Biome for lint instead of ESLint and fix fixable errors

## 1.4.0

### Minor Changes

- 36613e35: Sort routes by variable count and refactor useRoutes(), normalizeRouteInput() function

### Patch Changes

- 43a2f2a4: Resolved issue where `urlPatternOptions` props were passed to anchor tag.
- 6ad362f7: feat: add decode interface
- 8c774239: pass `urlPatternOptions` to `usePreloader()` hook

## 1.3.17-canary.0

### Minor Changes

- 36613e35: Sort routes by variable count and refactor useRoutes(), normalizeRouteInput() function

### Patch Changes

- feat: add decode interface
- Updated dependencies
- Updated dependencies [36613e35]
  - @stackflow/plugin-history-sync@1.4.0-canary.0
  - @stackflow/plugin-preload@1.3.0-canary.0
  - @stackflow/react@1.1.8-canary.0

## 1.3.16

### Patch Changes

- a32a7e09: chore: bump patch version
- Updated dependencies [a32a7e09]
- Updated dependencies [a32a7e09]
  - @stackflow/plugin-history-sync@1.3.18
  - @stackflow/plugin-preload@1.2.15
  - @stackflow/react@1.1.7
  - @stackflow/core@1.0.10

## 1.3.16-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.1.7-canary.0
  - @stackflow/core@1.0.10-canary.0
  - @stackflow/plugin-history-sync@1.3.18-canary.0
  - @stackflow/plugin-preload@1.2.15-canary.0

## 1.3.15

### Patch Changes

- e4c49cdc: chore: apply new release system
- Updated dependencies [e4c49cdc]
  - @stackflow/core@1.0.9
  - @stackflow/plugin-history-sync@1.3.14
  - @stackflow/plugin-preload@1.2.14
  - @stackflow/react@1.1.6

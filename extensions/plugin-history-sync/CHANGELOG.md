# @stackflow/plugin-history-sync

## 1.10.0

### Minor Changes

- 45fb7ba: Add encode option to Route interface for converting activity params to URL string params

## 1.9.0

### Minor Changes

- a7d0c01: Add an option to skip default history setup transition

## 1.8.1

### Patch Changes

- 567352a: Fix SSR compatibility by adding getServerSnapshot parameter to useSyncExternalStore. This resolves the "Missing getServerSnapshot, which is required for server-rendered content" error in SSR environments.

## 1.8.0

### Minor Changes

- f298988: Add `defaultHistory` route option to pre-seed stack for better deep link experiences
- 83ee5ed: Expose stack initialization process status for users to disable logging or fetching while initialization transition

## 1.7.1

### Patch Changes

- e323ce3: fix: add `decode()` interface to `Config` and support `path: string[]`

## 1.7.0

### Minor Changes

- 7b1780f: feat: Support `<Link />` in Future API

### Patch Changes

- dc26742: fix(plugin-history-sync): replace json-cycle with flatted

## 1.6.4-canary.0

### Patch Changes

- fix(plugin-history-sync): replace json-cycle with flatted

## 1.6.3

### Patch Changes

- 31dc20f: fix(plugin-history-sync): serialize state before pushState, replaceState

## 1.6.2

## 1.6.2-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.3.0-canary.0
  - @stackflow/core@1.1.0-canary.0

## 1.6.1

### Patch Changes

- 96ff22d: fix: enable cyclic dependency and fix promise return in loader

## 1.6.0

### Minor Changes

- 7df613a: Future API
- e9bb029: feat(plugin-history-sync): sort routes by computed score
- 7df613a: Stackflow Config and Loader API (2.0 Candidate API with `/future` namespace)

## 1.6.0-canary.0

### Minor Changes

- Future API

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.2.0-canary.0
  - @stackflow/config@1.0.1-canary.0

## 1.5.4

### Patch Changes

- 3e35026: chore: include declaration map

## 1.5.3

### Patch Changes

- 7788fbc: change asterisk(`*`) priority to lowest

## 1.5.2

### Patch Changes

- edfffda: use Biome for lint instead of ESLint and fix fixable errors

## 1.5.1

### Patch Changes

- 7df36f1b: accept only serializable parameters when making domain event

## 1.5.0

### Minor Changes

- cea51375: Pass initial search params to fallback activity as an activity params

## 1.4.0

### Minor Changes

- 36613e35: Sort routes by variable count and refactor useRoutes(), normalizeRouteInput() function

### Patch Changes

- 6ad362f7: feat: add decode interface
- 6ad362f7: fix(plugin-history-sync): decode search params

## 1.4.0-canary.1

### Patch Changes

- fix(plugin-history-sync): decode search params

## 1.4.0-canary.0

### Minor Changes

- 36613e35: Sort routes by variable count and refactor useRoutes(), normalizeRouteInput() function

### Patch Changes

- feat: add decode interface
- Updated dependencies
  - @stackflow/react@1.1.8-canary.0

## 1.3.18

### Patch Changes

- a32a7e09: chore: bump patch version
- Updated dependencies [a32a7e09]
- Updated dependencies [a32a7e09]
  - @stackflow/react@1.1.7
  - @stackflow/core@1.0.10

## 1.3.18-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.1.7-canary.0
  - @stackflow/core@1.0.10-canary.0

## 1.3.17

### Patch Changes

- 99c34fa4: fix(plugin-history-sync): request history tick on init

## 1.3.16

### Patch Changes

- 45cf3f4d: fix(plugin-history-sync)!: reduce loop count for parsing state

## 1.3.15

### Patch Changes

- f3b2d720: fix(plugin-history-sync): fix history queue on init

## 1.3.14

### Patch Changes

- e4c49cdc: chore: apply new release system
- Updated dependencies [e4c49cdc]
  - @stackflow/core@1.0.9
  - @stackflow/react@1.1.6

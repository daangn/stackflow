# @stackflow/plugin-basic-ui

## 1.18.0

### Minor Changes

- 4e4c0d9: Expose interfaces to modify width of edge
- 151b13f: Parameterize default appscreen transition offset and appscreen dim height

### Patch Changes

- 151b13f: Fix edge height

## 1.17.0

### Minor Changes

- a136f96: Expose interfaces to modify dimensions of AppBar

## 1.16.1

### Patch Changes

- fe8b8fe: Fix swipe back gesture during push/pop transitions by using capture phase event listeners to prevent touch events from reaching child elements during transitions
- Updated dependencies [fe8b8fe]
  - @stackflow/react-ui-core@1.3.3

## 1.16.0

### Minor Changes

- 99eff56: Export AppBar

## 1.15.1

### Patch Changes

- 733ebcb: Fix scroll behavior of AppScreen by attaching refs on paperContent

## 1.15.0

### Minor Changes

- 658c770: Allow components style to be customized directly

### Patch Changes

- c391bb7: Fix a bug that entrance transition is not applied.

## 1.14.2

### Patch Changes

- 371a39c: fix(plugin-basic-ui): update dependencies
- Updated dependencies [d2c50f3]
  - @stackflow/react-ui-core@1.3.2

## 1.14.1

### Patch Changes

- aef952a: fix(plugin-basic-ui): prevent touch events while transitioning for other basic components
- Updated dependencies [aef952a]
  - @stackflow/react-ui-core@1.3.1

## 1.14.0

### Minor Changes

- a7650d4: Support full screen gradient background and introduce new app bar entrance type "cover"

### Patch Changes

- Updated dependencies [a7650d4]
  - @stackflow/react-ui-core@1.3.0

## 1.13.1

### Patch Changes

- 5c4b96c: fix(react-ui-core): consider nullable stack
- Updated dependencies [5c4b96c]
  - @stackflow/react-ui-core@1.2.3

## 1.13.0

### Minor Changes

- 91413b6: To support various background designs, enable users to configure the background-image option in AppScreen, AppBar, BottomSheet and Modal.

### Patch Changes

- 8593b5a: fix(plugin-basic-ui,react-ui-core): prevent touch events while transitioning
- Updated dependencies [8593b5a]
  - @stackflow/react-ui-core@1.2.2

## 1.12.0

### Minor Changes

- cfa7af8: Supports dynamic import for activities, and delays transition effects while loading an activity or waiting for a loader response

### Patch Changes

- cfa7af8: fix(plugin-basic-ui): assign normalized values to global option provider

## 1.11.1

### Patch Changes

- 151631b: chore(plugin-basic-ui): update react-ui-core dependency

## 1.11.0

### Minor Changes

- f9f1399: Change to the latest AppBar style
- dc35bfc: feat(react-ui-core, plugin-basic-ui): add `onSwipe*` hooks and add data attributes and css variables

### Patch Changes

- Updated dependencies [dc35bfc]
  - @stackflow/react-ui-core@1.2.0

## 1.10.1

### Patch Changes

- eb9ed7c: fix(plugin-basic-ui): add `max()` in support query
- eb4578f: fix(plugin-basic-ui): add `maxWidth` option in <Modal />

## 1.10.0

### Minor Changes

- 5b1865e: feat(plugin-basic-ui): add interface to access z-index about AppScreen

## 1.9.2

### Patch Changes

- @stackflow/react-ui-core@1.1.2

## 1.9.2-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.3.2-canary.0
  - @stackflow/react-ui-core@1.1.2-canary.0

## 1.9.1

### Patch Changes

- @stackflow/react-ui-core@1.1.1

## 1.9.1-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.3.0-canary.0
  - @stackflow/core@1.1.0-canary.0
  - @stackflow/react-ui-core@1.1.1-canary.0

## 1.9.0

### Minor Changes

- e3dbaac: Extract core react hooks as a "@stackflow/react-ui-core" package

### Patch Changes

- Updated dependencies [e3dbaac]
  - @stackflow/react-ui-core@1.1.0

## 1.8.4

### Patch Changes

- 3e8df1b: fix(plugin-basic-ui): calculate app screen height correctly with safearea

## 1.8.3

## 1.8.3-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.2.0-canary.0

## 1.8.2

### Patch Changes

- 3e35026: chore: include declaration map

## 1.8.1

### Patch Changes

- bef6214: fix(plugin-basic-ui): remove `will-change` property

## 1.8.0

### Minor Changes

- 0f882e8: feat(plugin-basic-ui): export `useStyleEffect()`
- 0f882e8: feat(plugin-basic-ui): add `useZIndexBase()`

### Patch Changes

- edfffda: use Biome for lint instead of ESLint and fix fixable errors
- 3872e44: style(plugin-basic-ui): move top padding to margin

## 1.7.0

### Minor Changes

- 207b8490: Expose `paperRef` from `<BottomSheet />` and add `!important` paper exit transition

## 1.6.0

### Minor Changes

- 20d19546: theme branching via :root's dataset

## 1.5.3

## 1.5.3-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.1.8-canary.0

## 1.5.2

### Patch Changes

- a32a7e09: chore: bump patch version
- Updated dependencies [a32a7e09]
- Updated dependencies [a32a7e09]
  - @stackflow/react@1.1.7
  - @stackflow/core@1.0.10

## 1.5.2-canary.0

### Patch Changes

- Updated dependencies
  - @stackflow/react@1.1.7-canary.0
  - @stackflow/core@1.0.10-canary.0

## 1.5.1

### Patch Changes

- d4e86c55: fix hydration mismatch warning in server-side rendering

## 1.5.0

### Minor Changes

- dd5be87f: feat(plugin-basic-ui): export css variables from components

## 1.4.2

### Patch Changes

- e4c49cdc: chore: apply new release system
- Updated dependencies [e4c49cdc]
  - @stackflow/core@1.0.9
  - @stackflow/react@1.1.6

## 1.4.1

### Patch Changes

- 7dca11ee: feat(plugin-basic-ui): update IconBack component (#423)

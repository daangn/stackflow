# @karrotframe/navigator-plugin

<div align="center">

![](https://img.shields.io/npm/v/@karrotframe/navigator-plugin)
![](https://img.shields.io/npm/l/@karrotframe/navigator-plugin)
![](https://img.shields.io/npm/dt/@karrotframe/navigator-plugin)

</div>

[한국어](./README.ko.md)

**extensible plugin for @karrotframe/navigator**

- 🧩 lifecycle hooks to control event for @karrotframe/navigator
- 📭 apply middleware to lifecycle hooks
- 🖇️ independent state manage of plugin to support various scenarios

---

- [Install](#install)
- [Create simple plugin](#create-simple-plugin)
- [Create plugin with lifecycle hook of Navigator](#create-plugin-with-lifecycle-hook-of-navigator)
- [Create plugin to control state from plugin](#create-plugin-to-control-state-from-plugin)
- [Apply middleware to lifecycle hook](#apply-middleware-to-lifecycle-hook)
- [Lifecycle Hooks](#lifecycle-hooks)
  - [beforePush](#beforepush)
  - [onPushed](#onpushed)
  - [beforeReplace](#beforereplace)
  - [onReplaced](#onreplaced)
  - [beforePop](#beforepop)
  - [onPopped](#onpopped)
  - [onPoppedWithData](#onpoppedwithdata)
  - [beforeRegisterScreen](#beforeregisterscreen)
  - [onRegisterScreen](#onregisterscreen)
  - [beforeInsertScreenInstance](#beforeinsertscreeninstance)
  - [onInsertScreenInstance](#oninsertscreeninstance)
  - [beforeMapScreenInstance](#beforemapscreeninstance)
  - [onMapScreenInstance](#onmapscreeninstance)
  - [beforeAddScreenInstancePromise](#beforeaddscreeninstancepromise)
  - [onAddScreenInstancePromise](#onaddscreeninstancepromise)
  - [onMountNavbar](#onmountnavbar)
  - [onUnmountNavbar](#onunmountnavbar)
- [Interfaces](#interfaces)

---

## Install

```bash
$ yarn add @karrotframe/navigator-plugin
```

---

## Create simple plugin

### Define plugin

`plugins/index.ts`

```typescript
import type {
  PluginType,
  NavigatorPluginType,
} from '@karrotframe/navigator-plugin'

const pluginName = 'SimplePlugin'

export const useSimplePlugin = (): PluginType & {
  pluginName: string
} => {
  return pluginName
}

export const simplePlugin: NavigatorPluginType = {
  name: pluginName,
  executor: useSimplePlugin,
}
```

### Apply simple plugin

`App.tsx`

```typescript
import { simplePlugin } from './plugins'

const App: React.FC = () => {
  return (
    <Navigator plugins={[simplePlugin]}>
      <Screen path="/" component={Main} />
    </Navigator>
  )
}
```

`Main.tsx`

```typescript
import { useSimplePlugin } from './plugins'

const Main: React.FC = () => {
  const { pluginName } = useSimplePlugin()
  return (
    <div>
      <span>Main</span>
      <span>{pluginName}</span>
    </div>
  )
}
```

---

## Create plugin with lifecycle hook of Navigator

### Define plugin

`plugins/index.ts`

```typescript
import type {
  NavigatorPluginType,
  PluginType,
} from '@karrotframe/navigator-plugin'

export const loggerPlugin: NavigatorPluginType = {
  name: 'loggerPlugin',
  executor: (): PluginType => ({
    lifeCycleHooks: {
      onPoppedWithData: async ({ from, data }) => {
        console.log('from: ', from)
        console.log('data: ', data)
      },
    },
  }),
}
```

`onPoppedWithData` hook is called when user calls `pop().send(data)`.

This hook takes `from` and `data` arguments as you know.

You could also check other lifecycle hooks like `onPoppedWithData`.

---

## Create plugin to control state from plugin

### Define plugin

`plugins/index.ts`

```typescript
import React, { createContext, useContext, useState, useMemo } from 'react'
import type {
  NavigatorPluginType,
  PluginType,
} from '@karrotframe/navigator-plugin'

// Create context to control global state
export const ContextDataPlugin = createContext<{
  data: any
  setData: (data: any) => void
}>(null as any)

// Create provider to pass global state
export const DataPluginProvider: React.FC = (props) => {
  const [data, setData] = useState<any>(null)
  return (
    <ContextDataPlugin.Provider value={{ data, setData }}>
      {props.children}
    </ContextDataPlugin.Provider>
  )
}

export const useDataPlugin = (): PluginType & {
  dataFromNextPage: (params: { from: string }) => any
} => {
  const context = useContext(ContextDataPlugin)

  return useMemo(() => {
    return {
      lifeCycleHooks: {
        onPoppedWithData: async ({ from, data }) => {
          // control state of plugin in lifecycle hook
          context.setData({ [from]: data })
        },
      },
      // dataFromNextPage would be extracted to access state of plugin for component
      dataFromNextPage: ({ from }: { from: string }) => context?.data?.[from],
    }
  }, [context])
}

export const dataPlugin: NavigatorPluginType = {
  name: 'dataPlugin',
  provider: DataPluginProvider,
  executor: useDataPlugin,
}
```

You could use context api to control state of plugin from component.

In this example, this Provider would wrap `Navigator` to pass states.

And then you could access states of plugin from component.

### Apply plugin

`App.tsx`

```typescript
import { dataPlugin } from './plugins'

const App: React.FC = () => {
  return (
    <Navigator plugins={[dataPlugin]}>
      <Screen path="/" component={Main} />
      <Screen path="/other" component={Other} />
    </Navigator>
  )
}
```

`Main.tsx`

```typescript
import { useDataPlugin } from './plugins'

const Main: React.FC = () => {
  const { dataFromNextPage } = useDataPlugin()
  const result = useMemo(
    () => dataFromNextPage({ from: '/other' }),
    [dataFromNextPage]
  )

  return (
    <div>
      <span>Main</span>
      <span>{result}</span>
    </div>
  )
}
```

## Apply middleware to lifecycle hook

### Define plugin

```typescript
import type {
  BeforePushType,
  NavigatorPluginType,
  PluginType,
} from '@karrotframe/navigator-plugin'

// composeMiddlewares compose multiple middlewares for lifecycle hook.
import { composeMiddlewares } from '@karrotframe/navigator-plugin'

const filterPathMiddleware = async (
  ctx: BeforePushType,
  next: () => Promise<BeforePushType | void>
): Promise<BeforePushType | void> => {
  if (ctx.to === 'not valid') {
    // You could pass custom value as argument to next middleware
    await next({
      ...ctx,
      to: 'valid',
    })
  }
  // This next middleware would get basic arguments of lifecycle hook
  // because there is not any argument because there is not any argument for next function.
  await next()
}
const loggerMiddleware = async ({
  to,
}: BeforePushType): Promise<BeforePushType | void> => {
  console.log('to: ', to)
}

export const pluginWithMiddleware: NavigatorPluginType = {
  name: 'pluginWithMiddleware',
  executor: (): PluginType => ({
    lifeCycleHooks: {
      beforePush: composeMiddlewares<BeforePushType>([
        filterPathMiddleware,
        loggerMiddleware,
      ]),
    },
  }),
}
```

You could call next function as second argument of callback function when you use `composeMiddlewares` for hook.

You could control lifecycle hook by stages with middleware.

And next function could take custom value to pass this value to next middleware.

## Lifecycle Hooks

### beforePush

This hook calls callback function before `push()`

| name                | type              | description                                               | example      |
| ------------------- | ----------------- | --------------------------------------------------------- | ------------ |
| `to`                | String            | Route path by `push()`.                                   | `"/product"` |
| `screenInstances`   | IScreenInstance[] | Array that contains screen instance info from client      |              |
| `screenInstancePtr` | number            | The pointer to indicate current screen                    | `3`          |
| `options`           | Options           | push, replace, pop could be called from callback function |              |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### onPushed

This hook calls callback function immediately before route event(push).

| name                | type              | description                                               | example      |
| ------------------- | ----------------- | --------------------------------------------------------- | ------------ |
| `to`                | String            | Route path by `push()`.                                   | `"/product"` |
| `screenInstances`   | IScreenInstance[] | Array that contains screen instance info from client      |              |
| `screenInstancePtr` | number            | The pointer to indicate current screen                    | `3`          |
| `options`           | Options           | push, replace, pop could be called from callback function |              |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### beforeReplace

This hook calls callback function before `replace()`

| name      | type    | description                                               | example      |
| --------- | ------- | --------------------------------------------------------- | ------------ |
| `to`      | String  | Route path by `replace()`                                 | `"/account"` |
| `options` | Options | push, replace, pop could be called from callback function |              |

---

### onReplaced

This hook calls callback function immediately before route event(replace).

| name      | type    | description                                               | example      |
| --------- | ------- | --------------------------------------------------------- | ------------ |
| `to`      | String  | Route path by `replace()`                                 | `"/account"` |
| `options` | Options | push, replace, pop could be called from callback function |              |

---

### beforePop

This hook calls callback function before `pop()`

| name                | type              | description                                               | example        |
| ------------------- | ----------------- | --------------------------------------------------------- | -------------- |
| `from`              | String            | Route path by `pop()`                                     | `"/product/1"` |
| `screenInstances`   | IScreenInstance[] | Array that contains screen instance info from client      |                |
| `screenInstancePtr` | number            | The pointer to indicate current screen                    | `3`            |
| `options`           | Options           | push, replace, pop could be called from callback function |                |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### onPopped

This hook calls callback function before go back with provided depth(backwards count)

| name                | type              | description                                               | example        |
| ------------------- | ----------------- | --------------------------------------------------------- | -------------- |
| `from`              | String            | Route path by `pop()`                                     | `"/product/1"` |
| `screenInstances`   | IScreenInstance[] | Array that contains screen instance info from client      |                |
| `screenInstancePtr` | number            | The pointer to indicate current screen                    | `3`            |
| `options`           | Options           | push, replace, pop could be called from callback function |                |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### onPoppedWithData

This hook calls callback function when `pop().send()` is called.

| name                | type              | description                                               | example                |
| ------------------- | ----------------- | --------------------------------------------------------- | ---------------------- |
| `from`              | String            | Route path by `pop()`                                     | `"/product/1"`         |
| `data`              | object            | The data as argument of `pop().send()`                    | `{ name: 'John Doe' }` |
| `screenInstances`   | IScreenInstance[] | Array that contains screen instance info from client      |                        |
| `screenInstancePtr` | number            | The pointer to indicate current screen                    | `3`                    |
| `options`           | Options           | push, replace, pop could be called from callback function |                        |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### beforeRegisterScreen

Each screen is registered during render by ReactDOM,

if `Screen` components are defined as child component of `Navigator` component.

This hook calls callback function before register this screens.

| name      | type      | description                                                                     | example |
| --------- | --------- | ------------------------------------------------------------------------------- | ------- |
| `screen`  | IScreen   | The object that contains screen info as props for Screen component              |         |
| `screens` | IScreen[] | Array that contains each screen info as child components of Navigator component |         |

`screen`

```typescript
{
   id: '/main',
   path: '/main',
   component:  Main
}
```

---

### onRegisterScreen

Each screen is registered during render by ReactDOM,

if `Screen` components are defined as child component of `Navigator` component.

This hook calls callback function after register this screens.

| name      | type      | description                                                                                                                    | example |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `screen`  | IScreen   | The object that contains screen info as props for Screen component                                                             |         |
| `screens` | IScreen[] | Array that contains each screen info as child components of Navigator component. This array also contains screen object above. |         |

`screen`

```typescript
{
   id: '/main',
   path: '/main',
   component:  Main
}
```

---

### beforeInsertScreenInstance

ScreenInstance would be instantiated with screen info which is registered,

when any route event like `push` is triggered.

This hook calls callback function before such ScreenInstance is registered.

| name              | type              | description                                                                     | example |
| ----------------- | ----------------- | ------------------------------------------------------------------------------- | ------- |
| `screenInstance`  | IScreenInstance   | screen instance info from client                                                |         |
| `screenInstances` | IScreenInstance[] | Array that contains screen instance info from client                            |         |
| `ptr`             | number            | The pointer that indicates current screenInstance                               | `5`     |
| `options`         | Options           | setScreenInstances, setScreenInstancePtr could be called from callback function |         |

`screenInstances`

```typescript
;[
  {
    id: 4,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### onInsertScreenInstance

ScreenInstance would be instantiated with screen info which is registered,

when any route event like `push` is triggered.

This hook calls callback function just after such ScreenInstance is registered.

| name              | type              | description                                                                     | example |
| ----------------- | ----------------- | ------------------------------------------------------------------------------- | ------- |
| `screenInstance`  | IScreenInstance   | screen instance info from client                                                |         |
| `screenInstances` | IScreenInstance[] | Array that contains screen instance info from client                            |         |
| `ptr`             | number            | The pointer that indicates current screenInstance                               | `5`     |
| `options`         | Options           | setScreenInstances, setScreenInstancePtr could be called from callback function |         |

`screenInstances`

```typescript
;[
  {
    id: 4,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### beforeMapScreenInstance

You would need to modify properties of screenInstance in specific case with mapper function.

This hook calls callback functions before mapper function that will modify screenInstance is called

| name              | type              | description                                               | example |
| ----------------- | ----------------- | --------------------------------------------------------- | ------- |
| `screenInstances` | IScreenInstance[] | Array that contains screen instance info from client      |         |
| `ptr`             | number            | The pointer that indicates current screenInstance         | `4`     |
| `options`         | Options           | mapperScreenInstance could be called in callback function |         |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### onMapScreenInstance

You would need to modify properties of screenInstance in specific case with mapper function.

This hook calls callback functions right after mapper function that will modify screenInstance is called

| name              | type              | description                                               | example |
| ----------------- | ----------------- | --------------------------------------------------------- | ------- |
| `screenInstances` | IScreenInstance[] | Array that contains screen instance info from client      |         |
| `ptr`             | number            | The pointer that indicates current screenInstance         | `4`     |
| `options`         | Options           | mapperScreenInstance could be called in callback function |         |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### beforeAddScreenInstancePromise

`resolve` function of the promise for `push` will be declared to an object, `screenInstancePromiseMap`,

when `push` event is triggered or `pop()` event which includes `pop().send()` is triggered.

This hook calls callback function before initializing screenInstancePromiseMap by `screenInstanceId` with `resolve` function

| name                    | type                   | description                                                                  | example |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------- | ------- |
| `screenInstanceId`      | string                 | screenInstanceId which is matched with screenInstancePromise                 |         |
| `screenInstances`       | IScreenInstance[]      | Array that contains screen instance info from client                         |         |
| `screenInstancePtr`     | number                 | The pointer to indicate current screen                                       | `4`     |
| `screenInstancePromise` | IScreenInstancePromise | The object to save resolve function for screenInstance with screenInstanceId |         |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### onAddScreenInstancePromise

`resolve` function of the promise for `push` will be declared to an object, `screenInstancePromiseMap`,

when `push` event is triggered or `pop()` event which includes `pop().send()` is triggered.

This hook calls callback function right after initializing screenInstancePromiseMap by `screenInstanceId` with `resolve` function

| name                    | type                   | description                                                                  | example |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------- | ------- |
| `screenInstanceId`      | string                 | screenInstanceId which is matched with screenInstancePromise                 |         |
| `screenInstances`       | IScreenInstance[]      | Array that contains screen instance info from client                         |         |
| `screenInstancePtr`     | number                 | The pointer to indicate current screen                                       | `4`     |
| `screenInstancePromise` | IScreenInstancePromise | The object to save resolve function for screenInstance with screenInstanceId |         |

`screenInstances`

```typescript
;[
  {
    id: 2,
    screenId: '/product',
    nestedRouteCount: 0,
    present: false,
    as: '/product',
  },
]
```

---

### onMountNavbar

Props of `ScreenHelmet` are declared to set up App bar of top from `@karrotframe/navigator`.

A navbar should be mounted internally to render this App Bar.

This hook calls callback function when the navbar is mounted.

| name                | type               | description                                                  | example |
| ------------------- | ------------------ | ------------------------------------------------------------ | ------- |
| `screenHelmetProps` | IScreenHelmetProps | screenInstanceId which is matched with screenInstancePromise |         |

`screenHelmetProps`

```typescript
{
  appendLeft: "button",
  appendRight: {
    $$typeof: Symbol(react.element)
    key: null
    props: {children: '', onClick: ƒ}
    ref: null
    type: "div"
  },
  closeButtonLocation: "left",
  customBackButton: null,
  customCloseButton: null,
  disableScrollToTop: false,
  noBackButton: false,
  noBorder: false,
  noCloseButton: false,
  onTopClick: () => { console.log("hello world"); },
  preventSwipeBack: false,
  title: "Main",
  visible: true,
}
```

---

### onUnmountNavbar

Props of `ScreenHelmet` are declared to set up App bar of top from `@karrotframe/navigator`.

A navbar should be mounted internally to render this App Bar.

This hook calls callback function when the navbar is unmounted.

| name                | type               | description                                                  | example |
| ------------------- | ------------------ | ------------------------------------------------------------ | ------- |
| `screenHelmetProps` | IScreenHelmetProps | screenInstanceId which is matched with screenInstancePromise |         |

`screenHelmetProps`

```typescript
{
  appendLeft: "button",
  appendRight: {
    $$typeof: Symbol(react.element)
    key: null
    props: {children: '', onClick: ƒ}
    ref: null
    type: "div"
  },
  closeButtonLocation: "left",
  customBackButton: null,
  customCloseButton: null,
  disableScrollToTop: false,
  noBackButton: false,
  noBorder: false,
  noCloseButton: false,
  onTopClick: () => { console.log("hello world"); },
  preventSwipeBack: false,
  title: "Main",
  visible: true,
}
```

## Interfaces

```typescript
type NavigatorPluginType = {
  name: string
  provider?: React.FC
  executor: () => PluginType
}
```

```typescript
interface IScreen {
  id: string
  path: string
  Component: React.ComponentType
}
```

```typescript
interface IScreenInstance {
  id: string
  screenId: string
  nestedRouteCount?: number
  present: boolean
  as: string
}
```

```typescript
interface IScreenInstancePromise {
  resolve: (data: any | null) => void
}
```

```typescript
interface IScreenInstancePromise {
  title?: React.ReactNode
  appendLeft?: React.ReactNode
  appendRight?: React.ReactNode
  closeButtonLocation?: 'left' | 'right'
  customBackButton?: React.ReactNode
  customCloseButton?: React.ReactNode
  noBorder?: boolean
  disableScrollToTop?: boolean
  onTopClick?: () => void
  visible?: boolean
  preventSwipeBack?: boolean
  noBackButton?: boolean
  noCloseButton?: boolean
}
```

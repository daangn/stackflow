# @karrotframe/plugin

<div align="center">

![](https://img.shields.io/npm/v/@karrotframe/plugin)
![](https://img.shields.io/npm/l/@karrotframe/plugin)
![](https://img.shields.io/npm/dt/@karrotframe/plugin)

</div>

[English](./README.md)

**유연하고 확장가능한 @karrotframe/navigator 을 위한 plugin**

- 🧩 @karrotframe/navigator 라이프사이클 hook 을 이용한 이벤트 제어
- 📭 라이프사이클 hook 에 미들웨어 지원으로 단계별 이벤트 제어
- 🖇️ plugin 내부 상태 관리를 통한 다양한 사용자 시나리오 지원

---

- [설치](#설치)
- [간단한 plugin 만들기](#간단한-plugin-만들기)
- [Navigator 의 라이프사이클 hook 을 이용한 plugin 만들기](#Navigator-의-라이프사이클-hook-을-이용한-plugin-만들기)
- [plugin 에서 state 를 관리하면서 해당 state 를 어플리케이션에서 사용하는 방법](#plugin-에서-state-를-관리하면서-해당-state-를-어플리케이션에서-사용하는-방법)
- [lifecycle hook 에 미들웨어 적용하기](#lifecycle-hook-에-미들웨어-적용하기)
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
- [Interfaces](#interfaces)

---

## 설치

```bash
$ yarn add @karrotframe/plugin
```

---

## 간단한 plugin 만들기

### plugin 정의

`plugins/index.ts`

```typescript
import type { PluginType, NavigatorPluginType } from '@karrotframe/plugin'

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

### 생성한 plugin 적용하기

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

## Navigator 의 라이프사이클 hook 을 이용한 plugin 만들기

### plugin 정의

`plugins/index.ts`

```typescript
import type { NavigatorPluginType, PluginType } from '@karrotframe/plugin'

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

`onPoppedWithData` hook 은 `pop().send(data)` 를 호출할 때 불리는 hook 이에요.

인자로 `pop()` 을 호출하는 screen path 인 `from` 값과, `pop().send(data)` 에서 전달한 인자인 `data` 값을 받아요.

lifecycle hook 은 `onPoppedWithData` 이외에도 여러가지가 존재해요.

---

## plugin 에서 state 를 관리하면서 해당 state 를 어플리케이션에서 사용하는 방법

### plugin 정의

`plugins/index.ts`

```typescript
import React, { createContext, useContext, useState, useMemo } from 'react'
import type { NavigatorPluginType, PluginType } from '@karrotframe/plugin'

// 전역 state 를 관리하기 위한 context 생성
export const ContextDataPlugin = createContext<{
  data: any
  setData: (data: any) => void
}>(null as any)

// 전역 state 를 전달하기 위한 provider 생성:
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
          // lifecycle hook 에서 plugin 의 state 를 제어해요
          context.setData({ [from]: data })
        },
      },
      // dataFromNextPage 을 컴포넌트에서 호출해서 컴포넌트가 plugin 의 state 에 접근 가능하도록 해요
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

plugin 내부에서 state 를 제어하고, 이 state 를 컴포넌트에서 접근할 수 있도록 context api 를 사용해요.

예시에서 생성한 provider 는, 플러그인을 Navigator 에 적용할 때 Navigator 를 감싸는 provider 로 작동해요.

이러한 방법으로 plugin 의 state 를 Navigator 의 전역에서 사용이 가능해요.

### 생성한 플러그인 적용하기

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

## lifecycle hook 에 미들웨어 적용하기

### plugin 정의

```typescript
import type {
  BeforePushType,
  NavigatorPluginType,
  PluginType,
} from '@karrotframe/plugin'

// hook 에 적용할 미들웨어를 하나로 묶어주는 역할을 해요
import { composeMiddlewares } from '@karrotframe/plugin'

const filterPathMiddleware = async (
  ctx: BeforePushType,
  next: () => Promise<BeforePushType | void>
): Promise<BeforePushType | void> => {
  if (ctx.to === 'not valid') {
    // 미들웨어에서 value 를 가공해서 다음 미들웨어에게 전달할 수 있어요
    await next({
      ...ctx,
      to: 'valid',
    })
  }
  // next() 에 인자를 전달하지 않은 경우, 다음 미들웨어는 hook 이 기본적으로 받는 인자를 전달 받아요
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

`composeMiddlewares` 로 middleware 를 묶을 경우, hook 에 전달할 콜백 함수의 두번째 인자인 next 함수를 호출 가능해요.

미들웨어로 hook 의 lifecycle 을 단계적으로 다룰 수 있고, 값을 가공해서 next() 의 인자로 전달하여

다음 미들웨어가 기본적으로 받는 hook 의 context 인자 대신, 선행한 미들웨어가 가공한 context 인자를 받을 수 있어요.

## Lifecycle Hooks

### beforePush

`push()` 를 호출 전에 콜백을 실행해요.

| name                | type              | description                                                             | example      |
| ------------------- | ----------------- | ----------------------------------------------------------------------- | ------------ |
| `to`                | String            | `push()` 호출을 통해 이동하려는 path 에요.                              | `"/product"` |
| `screenInstances`   | IScreenInstance[] | 클라이언트에서 보고 있는 화면(screen) 인스턴스 정보를 저장한 배열이에요 |              |
| `screenInstancePtr` | number            | 현재(current) 화면(screen)을 가리키는 pointer 에요.                     | `3`          |
| `options`           | Options           | push, replace, pop 을 콜백 함수에서 호출 할 수 있어요                   |              |

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

target path 로 route 이동(push)을 실행하기 직전에 콜백 함수를 실행해요.

| name                | type              | description                                                             | example      |
| ------------------- | ----------------- | ----------------------------------------------------------------------- | ------------ |
| `to`                | String            | `push()` 호출을 통해 이동하려는 path 에요.                              | `"/product"` |
| `screenInstances`   | IScreenInstance[] | 클라이언트에서 보고 있는 화면(screen) 인스턴스 정보를 저장한 배열이에요 |              |
| `screenInstancePtr` | number            | 현재(current) 화면(screen)을 가리키는 pointer 에요.                     | `3`          |
| `options`           | Options           | push, replace, pop 을 콜백 함수에서 호출 할 수 있어요                   |              |

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

`replace()` 를 호출 전에 콜백을 실행해요.

| name      | type    | description                                           | example      |
| --------- | ------- | ----------------------------------------------------- | ------------ |
| `to`      | String  | `replace()` 호출을 통해 이동하려는 path 에요.         | `"/account"` |
| `options` | Options | push, replace, pop 을 콜백 함수에서 호출 할 수 있어요 |              |

---

### onReplaced

target path 로 route 이동(replace)을 실행하기 직전에 콜백 함수를 실행해요.

| name      | type    | description                                           | example      |
| --------- | ------- | ----------------------------------------------------- | ------------ |
| `to`      | String  | `replace()` 호출을 통해 이동하려는 path 에요.         | `"/account"` |
| `options` | Options | push, replace, pop 을 콜백 함수에서 호출 할 수 있어요 |              |

---

### beforePop

`pop()` 를 호출 전에 콜백을 실행해요.

| name                | type              | description                                                             | example        |
| ------------------- | ----------------- | ----------------------------------------------------------------------- | -------------- |
| `from`              | String            | `pop()` 호출하는 시점의 path 에요.                                      | `"/product/1"` |
| `screenInstances`   | IScreenInstance[] | 클라이언트에서 보고 있는 화면(screen) 인스턴스 정보를 저장한 배열이에요 |                |
| `screenInstancePtr` | number            | 현재(current) 화면(screen)을 가리키는 pointer 에요.                     | `3`            |
| `options`           | Options           | push, replace, pop 을 콜백 함수에서 호출 할 수 있어요                   |                |

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

주어진 depth 만큼 이전 route 로 이동을 실행하기 직전에 콜백 함수를 실행해요.

| name                | type            | description                                                             | example        |
| ------------------- | --------------- | ----------------------------------------------------------------------- | -------------- |
| `from`              | String          | `pop()` 호출하는 시점의 path 에요.                                      | `"/product/1"` |
| `screenInstances`   | IScreenInstance | 클라이언트에서 보고 있는 화면(screen) 인스턴스 정보를 저장한 배열이에요 |                |
| `screenInstancePtr` | number          | 현재(current) 화면(screen)을 가리키는 pointer 에요.                     | `3`            |
| `options`           | Options         | push, replace, pop 을 콜백 함수에서 호출 할 수 있어요                   |                |

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

`pop().send()` 를 호출할 때 콜백 함수를 실행해요.

| name                | type            | description                                                             | example                |
| ------------------- | --------------- | ----------------------------------------------------------------------- | ---------------------- |
| `from`              | String          | `pop()` 호출하는 시점의 path 에요.                                      | `"/product/1"`         |
| `data`              | object          | `pop().send()` 의 인자로 전달하는 data 에요                             | `{ name: 'John Doe' }` |
| `screenInstances`   | IScreenInstance | 클라이언트에서 보고 있는 화면(screen) 인스턴스 정보를 저장한 배열이에요 |                        |
| `screenInstancePtr` | number          | 현재(current) 화면(screen)을 가리키는 pointer 에요.                     | `3`                    |
| `options`           | Options         | push, replace, pop 을 콜백 함수에서 호출 할 수 있어요                   |                        |

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

`Navigator` 컴포넌트에 `Screen` 컴포넌트를 child 컴포넌트로 선언하면 render 할 때 해당 screen 을 등록해요.

이 screen 등록 전에 콜백 함수를 호출해요.

| name      | type      | description                                                               | example |
| --------- | --------- | ------------------------------------------------------------------------- | ------- |
| `screen`  | IScreen   | Screen 컴포넌트에 props 로 전달하는 screen 정보를 담는 오브젝트에요       |         |
| `screens` | IScreen[] | Navigator 의 child 컴포넌트로 선언한 각 screen 정보를 배열에 담고 있어요. |         |

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

`Navigator` 컴포넌트에 `Screen` 컴포넌트를 child 컴포넌트로 선언하면 render 할 때 해당 screen 을 등록해요.

이 screen 을 등록한 후에 콜백 함수를 호출해요.

| name      | type      | description                                                               | example |
| --------- | --------- | ------------------------------------------------------------------------- | ------- |
| `screen`  | IScreen   | Screen 컴포넌트에 props 로 전달하는 screen 정보를 담는 오브젝트에요       |         |
| `screens` | IScreen[] | Navigator 의 child 컴포넌트로 선언한 각 screen 정보를 배열에 담고 있어요. |         |

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

`push` 등의 route 이벤트가 발생하면, navigator 에 등록한 screen 정보를 기반으로 ScreenInstance 를 생성해요.

이 ScreenInstance 를 어플리케이션에 등록해서, 각 screen 화면을 개별적인 인스턴스로 다루는 과정을 거칠 때

어플리케이션에 ScreenInstance 를 등록하기 전에 콜백 함수를 호출해요.

| name              | type              | description                                                                   | example |
| ----------------- | ----------------- | ----------------------------------------------------------------------------- | ------- |
| `screenInstance`  | IScreenInstance   | 클라이언트에서 보고 있는 화면(screen) 인스턴스 정보를 가지고 있어요.          |         |
| `screenInstances` | IScreenInstance[] | 지금까지 등록한 screenInstance 을 배열로 가지고 있어요.                       |         |
| `ptr`             | number            | 현재 등록하려는 screenInstance 를 가리키는 pointer 에요.                      | `5`     |
| `options`         | Options           | setScreenInstances 나 setScreenInstancePtr 을 콜백 함수에서 호출 할 수 있어요 |         |

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

`push` 등의 route 이벤트가 발생하면, navigator 에 등록한 screen 정보를 기반으로 ScreenInstance 를 생성해요.

이 ScreenInstance 를 어플리케이션에 등록해서, 각 screen 화면을 개별적인 인스턴스로 다루는 과정을 거칠 때

어플리케이션에 ScreenInstance 를 등록 직후에 콜백 함수를 호출해요.

| name              | type              | description                                                                                                        | example |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ | ------- |
| `screenInstance`  | IScreenInstance   | 클라이언트에서 보고 있는 화면(screen) 인스턴스 정보를 가지고 있어요.                                               |         |
| `screenInstances` | IScreenInstance[] | 지금까지 등록한 screenInstance 을 배열로 가지고 있어요. 방금 등록한 screenInstance 또한 배열 요소로 가지고 있어요. |         |
| `ptr`             | number            | 현재 등록하려는 screenInstance 를 가리키는 pointer 에요.                                                           | `5`     |
| `options`         | Options           | setScreenInstances 나 setScreenInstancePtr 을 콜백 함수에서 호출 할 수 있어요                                      |         |

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

특정 상황에서, 특정 screenInstance 의 프로퍼티를 수정하는 경우가 있어요.

이 때 특정 screenInstance 를 지정해서 프로퍼티를 수정하는 mapper 함수를 호출하기 전에

콜백 함수를 실행해요.

| name              | type              | description                                                                                                        | example |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ | ------- |
| `screenInstances` | IScreenInstance[] | 지금까지 등록한 screenInstance 을 배열로 가지고 있어요. 방금 등록한 screenInstance 또한 배열 요소로 가지고 있어요. |         |
| `ptr`             | number            | 현재 수정하려는 screenInstance 를 가리키는 pointer 에요.                                                           | `4`     |
| `options`         | Options           | mapperScreenInstance 를 콜백 함수에서 호출 할 수 있어요.                                                           |         |

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

특정 상황에서, 특정 screenInstance 의 프로퍼티를 수정하는 경우가 있어요.

이 때 특정 screenInstance 를 지정해서 프로퍼티를 수정하는 mapper 함수를 호출하여

특정 screenInstance 의 프로퍼티를 변경한 직후에

콜백 함수를 실행해요.

| name              | type              | description                                                                                                        | example |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ | ------- |
| `screenInstances` | IScreenInstance[] | 지금까지 등록한 screenInstance 을 배열로 가지고 있어요. 방금 등록한 screenInstance 또한 배열 요소로 가지고 있어요. |         |
| `ptr`             | number            | 수정한 screenInstance 를 가리키는 pointer 에요.                                                                    | `4`     |
| `options`         | Options           | mapperScreenInstance 를 콜백 함수에서 호출 할 수 있어요.                                                           |         |

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

`push` 이벤트를 발생시킬 때, `pop()` 이벤트가 발생하거나 `pop().send()` 를 호출할 때

promise 인 push 이벤트를 resolve 하는 resolve 함수를 screenInstanceId 에 대응해

오브젝트로 등록해요.

이 오브젝트를 global state 에서 다루는 screenInstancePromiseMap 에 등록하기 전에

콜백 함수를 실행해요.

| name                    | type                   | description                                                                                                       | example |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- |
| `screenInstanceId`      | string                 | screenInstancePromise 를 등록하려는 screenInstanceId 값이에요.                                                    |         |
| `screenInstances`       | IScreenInstance[]      | 지금까지 등록한 screenInstance 을 배열로 가지고 있어요.                                                           |         |
| `screenInstancePtr`     | number                 | 현재(current) 화면(screen)을 가리키는 pointer 에요                                                                | `4`     |
| `screenInstancePromise` | IScreenInstancePromise | screenInstanceId 에 대응하는 screenInstance 의 push 이벤트를 resolve 하기 위한 resolve 함수를 저장한 오브젝트에요 |         |

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

`push` 이벤트를 발생시킬 때, `pop()` 이벤트가 발생하거나 `pop().send()` 를 호출할 때

promise 인 push 이벤트를 resolve 하는 resolve 함수를 screenInstanceId 에 대응해

오브젝트로 등록해요.

이 오브젝트를 global state 에서 다루는 screenInstancePromiseMap 에 등록한 직후에

콜백 함수를 실행해요.

| name                    | type                   | description                                                                                                       | example |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- |
| `screenInstanceId`      | string                 | screenInstancePromise 를 등록하려는 screenInstanceId 값이에요.                                                    |         |
| `screenInstances`       | IScreenInstance[]      | 지금까지 등록한 screenInstance 을 배열로 가지고 있어요.                                                           |         |
| `screenInstancePtr`     | number                 | 현재(current) 화면(screen)을 가리키는 pointer 에요                                                                | `4`     |
| `screenInstancePromise` | IScreenInstancePromise | screenInstanceId 에 대응하는 screenInstance 의 push 이벤트를 resolve 하기 위한 resolve 함수를 저장한 오브젝트에요 |         |

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

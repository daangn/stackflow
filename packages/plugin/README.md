# karrotframe plugins extensions

## hook interface

```typescript
interface IScreenInstance {
  id: string
  screenId: string
  nestedRouteCount: number
  present: boolean
  as: string
}

interface Options {
  pop?: (from: string) => void
  push?: (to: string) => void
  replace?: (to: string) => void
  mapperScreenInstance?: (screenInstance: IScreenInstance) => IScreenInstance
}

interface HookParams {
  options?: Options
}

interface BeforePushType extends HookParams {
  to: string
}

interface OnPushedType extends HookParams {
  to: string
}

interface BeforePop extends HookParams {
  from: string
}

interface OnPopped extends HookParams {
  from: string
}

interface OnPoppedWithDataType extends HookParams {
  from: string
  data?: any
}

interface beforeReplace extends HookParams {
  to: string
}

interface onReplaced extends HookParams {
  to: string
}

interface onRegisterScreen extends HookParams {
  screen: {
    id: string
    path: string
    Component: React.ComponentType
  }
}

interface onInsertScreenInstance extends HookParams {
  ptr: number
  screenInstance: {
    id: string
    screenId: string
    present: boolean
    as: string
  }
}

interface onMapScreenInstance extends HookParams {
  ptr: number
}

interface onAddScreenInstancePromise extends HookParams {
  screenInstanceId: string
  screenInstancePromise: {
    resolve: (data: any | null) => void
    onNextPagePopped?: (from: string, data: any) => void
  }
}

interface PluginType {
  lifeCycleHooks: {
    beforePush?: (
      context: BeforePushType,
      next: () => Promise<BeforePushType | void>
    ) => Promise<BeforePushType | void>
    onPushed?: (
      context: OnPushedType,
      next: () => Promise<OnPushedType | void>
    ) => Promise<OnPushedType | void>
    beforePop?: (
      context: BeforePop,
      next: () => Promise<BeforePop | void>
    ) => Promise<BeforePop | void>
    onPopped?: (
      context: OnPopped,
      next: () => Promise<OnPopped | void>
    ) => Promise<OnPopped | void>
    onPoppedWithData?: (
      context: OnPoppedWithDataType,
      next: () => Promise<OnPoppedWithDataType | void>
    ) => Promise<OnPoppedWithDataType | void>
    beforeReplace?: (
      context: beforeReplace,
      next: () => Promise<beforeReplace | void>
    ) => Promise<beforeReplace | void>
    onReplaced?: (
      context: onReplaced,
      next: () => Promise<onReplaced | void>
    ) => Promise<onReplaced | void>
    onRegisterScreen?: (
      context: onRegisterScreen,
      next: () => Promise<onRegisterScreen | void>
    ) => Promise<onRegisterScreen | void>
    onInsertScreenInstance?: (
      context: onInsertScreenInstance,
      next: () => Promise<onInsertScreenInstance | void>
    ) => Promise<onInsertScreenInstance | void>
    onMapScreenInstance?: (
      context: onMapScreenInstance,
      next: () => Promise<onMapScreenInstance | void>
    ) => Promise<onMapScreenInstance | void>
    onAddScreenInstancePromise?: (
      context: onAddScreenInstancePromise,
      next: () => Promise<onAddScreenInstancePromise | void>
    ) => Promise<onAddScreenInstancePromise | void>
  }
}

type NavigatorPluginType = {
  name: string
  provider?: React.FC
  executor: () => PluginType
}
```

## plugin example

```typescript jsx
import React, { createContext, useContext, useState, useMemo } from 'react'
import type { NavigatorPluginType, PluginType } from '../types/navigator'

export const ContextDataPlugin = createContext<{
  data: any
  setData: (data: any) => void
}>(null as any)

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
          context.setData({ [from]: data })
        },
      },
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

```typescript jsx
const App: React.FC = () => {
  return (
    <Navigator plugins={[dataPlugin]}>
      <Screen path="/" component={PageHome} />
    </Navigator>
  )
}
```

## composeMiddleware

### example

```typescript
const customMiddlewareFirst = async (
  ctx: BeforePushType,
  next: () => Promise<BeforePushType | void>
): Promise<BeforePushType | void> => {
  await next()
}
const customMiddlewareSecond = async (
  ctx: BeforePushType,
  next: () => Promise<BeforePushType | void>
): Promise<BeforePushType | void> => {
  next()
}
const customMiddlewareThird = async (
  ctx: BeforePushType,
  next: () => Promise<BeforePushType | void>
): Promise<BeforePushType | void> => {
  await next()
}

const middlewareLoggerPlugin: NavigatorPluginType = {
  name: 'middlewareLoggerPlugin',
  executor: () => ({
      lifeCycleHooks: {
          beforePush: composeMiddlewares<BeforePushType>([
              customMiddlewareFirst,
              customMiddlewareSecond,
              customMiddlewareThird,
          ]),
      },
  }),
}
```

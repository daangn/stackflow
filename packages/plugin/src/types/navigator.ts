import React from 'react'

interface IScreen {
  id: string
  path: string
  Component: React.ComponentType
}

interface IScreenInstance {
  id: string
  screenId: string
  nestedRouteCount?: number
  present: boolean
  as: string
}

interface Options {
  pop?: (from: string) => void
  push?: (to: string) => void
  replace?: (to: string) => void
  preventPop?: () => void
  preventPush?: () => void
  preventReplace?: () => void
  mapperScreenInstance?: (screenInstance: IScreenInstance) => IScreenInstance
  setScreenInstances?: (screenInstances: IScreenInstance[]) => void
  setScreenInstancePtr?: (ptr: number) => void
}
interface HookParams {
  options?: Options
}
export interface BeforePushType extends HookParams {
  to: string
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
}
export interface OnPushedType extends HookParams {
  to: string
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
}
export interface BeforePop extends HookParams {
  from: string
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
}

export interface OnPopped extends HookParams {
  from: string
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
}
export interface OnPoppedWithDataType extends HookParams {
  from: string
  data?: any
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
}
export interface BeforeReplace extends HookParams {
  to: string
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
}
export interface OnReplaced extends HookParams {
  to: string
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
}
export interface BeforeRegisterScreen extends HookParams {
  screen: IScreen
  screens: IScreen[]
}
export interface OnRegisterScreen extends HookParams {
  screen: IScreen
  screens: IScreen[]
}
export interface OnInsertScreenInstance extends HookParams {
  ptr: number
  screenInstance: IScreenInstance
  screenInstances: IScreenInstance[]
}
export interface BeforeInsertScreenInstance extends HookParams {
  ptr: number
  screenInstance: IScreenInstance
  screenInstances: IScreenInstance[]
}
export interface BeforeMapScreenInstance extends HookParams {
  ptr: number
  screenInstances: IScreenInstance[]
}
export interface OnMapScreenInstance extends HookParams {
  ptr: number
  screenInstances: IScreenInstance[]
}
export interface BeforeAddScreenInstancePromise extends HookParams {
  screenInstanceId: string
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
  screenInstancePromise: {
    resolve: (data: any | null) => void
  }
}
export interface OnAddScreenInstancePromise extends HookParams {
  screenInstanceId: string
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
  screenInstancePromise: {
    resolve: (data: any | null) => void
  }
}

export interface PluginType {
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
      context: BeforeReplace,
      next: () => Promise<BeforeReplace | void>
    ) => Promise<BeforeReplace | void>
    onReplaced?: (
      context: OnReplaced,
      next: () => Promise<OnReplaced | void>
    ) => Promise<OnReplaced | void>
    beforeRegisterScreen?: (
      context: BeforeRegisterScreen,
      next: () => Promise<BeforeRegisterScreen | void>
    ) => Promise<BeforeRegisterScreen | void>
    onRegisterScreen?: (
      context: OnRegisterScreen,
      next: () => Promise<OnRegisterScreen | void>
    ) => Promise<OnRegisterScreen | void>
    beforeInsertScreenInstance?: (
      context: BeforeInsertScreenInstance,
      next: () => Promise<BeforeInsertScreenInstance | void>
    ) => Promise<BeforeInsertScreenInstance | void>
    onInsertScreenInstance?: (
      context: OnInsertScreenInstance,
      next: () => Promise<OnInsertScreenInstance | void>
    ) => Promise<OnInsertScreenInstance | void>
    beforeMapScreenInstance?: (
      context: BeforeMapScreenInstance,
      next: () => Promise<BeforeMapScreenInstance | void>
    ) => Promise<BeforeMapScreenInstance | void>
    onMapScreenInstance?: (
      context: OnMapScreenInstance,
      next: () => Promise<OnMapScreenInstance | void>
    ) => Promise<OnMapScreenInstance | void>
    beforeAddScreenInstancePromise?: (
      context: BeforeAddScreenInstancePromise,
      next: () => Promise<BeforeAddScreenInstancePromise | void>
    ) => Promise<BeforeAddScreenInstancePromise | void>
    onAddScreenInstancePromise?: (
      context: OnAddScreenInstancePromise,
      next: () => Promise<OnAddScreenInstancePromise | void>
    ) => Promise<OnAddScreenInstancePromise | void>
  }
}
export type NavigatorPluginType = {
  name: string
  provider?: React.FC
  executor: () => PluginType
}

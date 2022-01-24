import React from 'react'

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
  preventPop?: () => void
  preventPush?: () => void
  preventReplace?: () => void
  mapperScreenInstance?: (screenInstance: IScreenInstance) => IScreenInstance
}
interface HookParams {
  options?: Options
}
export interface BeforePushType extends HookParams {
  to: string
}
export interface OnPushedType extends HookParams {
  to: string
}
export interface BeforePop extends HookParams {
  from: string
}
export interface OnPopped extends HookParams {
  from: string
}
export interface OnPoppedWithDataType extends HookParams {
  from: string
  data?: any
}
export interface beforeReplace extends HookParams {
  to: string
}
export interface onReplaced extends HookParams {
  to: string
}
export interface onRegisterScreen extends HookParams {
  screen: {
    id: string
    path: string
    Component: React.ComponentType
  }
}
export interface onInsertScreenInstance extends HookParams {
  ptr: number
  screenInstance: {
    id: string
    screenId: string
    present: boolean
    as: string
  }
}
export interface onMapScreenInstance extends HookParams {
  ptr: number
}
export interface onAddScreenInstancePromise extends HookParams {
  screenInstanceId: string
  screenInstancePromise: {
    resolve: (data: any | null) => void
    onNextPagePopped?: (from: string, data: any) => void
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
export type NavigatorPluginType = {
  name: string
  provider?: React.FC
  executor: () => PluginType
}

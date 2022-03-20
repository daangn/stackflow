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

export interface IScreenHelmetProps {
  /**
   * title
   */
  title?: React.ReactNode

  /**
   * Append elements in left side
   * (It'll be displayed in right side of back button)
   */
  appendLeft?: React.ReactNode

  /**
   * Append elements in right side
   * (It'll be displayed in left side of close button when `closeButtonLocation` is `right`)
   */
  appendRight?: React.ReactNode

  /**
   * Location of close button (default: `left`)
   */
  closeButtonLocation?: 'left' | 'right'

  /**
   * Replace back button
   */
  customBackButton?: React.ReactNode

  /**
   * Replace close button
   */
  customCloseButton?: React.ReactNode

  /**
   * Remove border
   */
  noBorder?: boolean

  /**
   * Disable scroll to top feature (iOS Only)
   */
  disableScrollToTop?: boolean

  /**
   * When top part clicked (iOS Only)
   */
  onTopClick?: () => void

  /**
   * Set visibility for NavBar (default: `true`)
   */
  visible?: boolean

  /**
   * block event when users try to swipe back
   */
  preventSwipeBack?: boolean

  /**
   * hide back button from navbar in ScreenHelmet
   */
  noBackButton?: boolean

  /**
   * hide close button from navbar in ScreenHelmet
   */
  noCloseButton?: boolean
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

export interface OnMountNavbar extends HookParams {
  screenHelmetProps: IScreenHelmetProps
}

export interface OnUnmountNavbar extends HookParams {
  screenHelmetProps: IScreenHelmetProps
}

export interface PluginType {
  lifeCycleHooks: {
    beforePush?: (
      context: BeforePushType,
      next: (newCtx?: any) => Promise<BeforePushType | void>
    ) => Promise<BeforePushType | void>
    onPushed?: (
      context: OnPushedType,
      next: (newCtx?: any) => Promise<OnPushedType | void>
    ) => Promise<OnPushedType | void>
    beforePop?: (
      context: BeforePop,
      next: (newCtx?: any) => Promise<BeforePop | void>
    ) => Promise<BeforePop | void>
    onPopped?: (
      context: OnPopped,
      next: (newCtx?: any) => Promise<OnPopped | void>
    ) => Promise<OnPopped | void>
    onPoppedWithData?: (
      context: OnPoppedWithDataType,
      next: (newCtx?: any) => Promise<OnPoppedWithDataType | void>
    ) => Promise<OnPoppedWithDataType | void>
    beforeReplace?: (
      context: BeforeReplace,
      next: (newCtx?: any) => Promise<BeforeReplace | void>
    ) => Promise<BeforeReplace | void>
    onReplaced?: (
      context: OnReplaced,
      next: (newCtx?: any) => Promise<OnReplaced | void>
    ) => Promise<OnReplaced | void>
    beforeRegisterScreen?: (
      context: BeforeRegisterScreen,
      next: (newCtx?: any) => Promise<BeforeRegisterScreen | void>
    ) => Promise<BeforeRegisterScreen | void>
    onRegisterScreen?: (
      context: OnRegisterScreen,
      next: (newCtx?: any) => Promise<OnRegisterScreen | void>
    ) => Promise<OnRegisterScreen | void>
    beforeInsertScreenInstance?: (
      context: BeforeInsertScreenInstance,
      next: (newCtx?: any) => Promise<BeforeInsertScreenInstance | void>
    ) => Promise<BeforeInsertScreenInstance | void>
    onInsertScreenInstance?: (
      context: OnInsertScreenInstance,
      next: (newCtx?: any) => Promise<OnInsertScreenInstance | void>
    ) => Promise<OnInsertScreenInstance | void>
    beforeMapScreenInstance?: (
      context: BeforeMapScreenInstance,
      next: (newCtx?: any) => Promise<BeforeMapScreenInstance | void>
    ) => Promise<BeforeMapScreenInstance | void>
    onMapScreenInstance?: (
      context: OnMapScreenInstance,
      next: (newCtx?: any) => Promise<OnMapScreenInstance | void>
    ) => Promise<OnMapScreenInstance | void>
    beforeAddScreenInstancePromise?: (
      context: BeforeAddScreenInstancePromise,
      next: (newCtx?: any) => Promise<BeforeAddScreenInstancePromise | void>
    ) => Promise<BeforeAddScreenInstancePromise | void>
    onAddScreenInstancePromise?: (
      context: OnAddScreenInstancePromise,
      next: (newCtx?: any) => Promise<OnAddScreenInstancePromise | void>
    ) => Promise<OnAddScreenInstancePromise | void>
    onMountNavbar?: (
      context: OnMountNavbar,
      next: (newCtx?: any) => Promise<OnMountNavbar | void>
    ) => Promise<OnAddScreenInstancePromise | void>
    onUnmountNavbar?: (
      context: OnUnmountNavbar,
      next: (newCtx?: any) => Promise<OnUnmountNavbar | void>
    ) => Promise<OnUnmountNavbar | void>
  }
}
export type NavigatorPluginType = {
  name: string
  provider?: React.FC
  executor: () => PluginType
}

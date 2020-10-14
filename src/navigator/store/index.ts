import React from 'react'
import { action, observable, ObservableMap } from 'mobx'

export interface Screen {
  id: string
  path: string
  Component: React.FC<{ screenInstanceId: string }>
}

export interface ScreenInstance {
  id: string
  screenId: string
  nestedRouteCount: number
}

export interface ScreenInstanceOption {
  navbar: NavbarOptions
}

export interface NavbarOptions {
  visible: boolean
  title: React.ReactNode | null
  appendLeft: React.ReactNode | null
  appendRight: React.ReactNode | null
  closeButtonLocation: 'left' | 'right'
  customBackButton: React.ReactNode | null
  customCloseButton: React.ReactNode | null
}

export type ScreenInstancePromise = (data: any | null) => void

export interface ScreenEdge {
  startTime: number | null
  startX: number | null
}

const store = observable<{
  screens: ObservableMap<string, Screen>
  screenInstances: ScreenInstance[]
  screenInstancePtr: number
  screenInstanceOptions: ObservableMap<string, ScreenInstanceOption>
  screenInstancePromises: ObservableMap<string, ScreenInstancePromise>
  screenEdge: ScreenEdge
}>({
  screens: observable.map<string, Screen>({}, { deep: false }),
  screenInstances: [],
  screenInstancePtr: -1,
  screenInstanceOptions: observable.map<string, ScreenInstanceOption>({}, { deep: false }),
  screenInstancePromises: observable.map<string, ScreenInstancePromise>({}, { deep: false }),
  screenEdge: {
    startX: null,
    startTime: null,
  },
})

export const setScreenInstanceIn = action((ptr: number, setter: (screenInstance: ScreenInstance) => ScreenInstance) => {
  store.screenInstances = store.screenInstances.map((screenInstance, screenInstanceIndex) => {
    if (screenInstanceIndex === ptr) {
      return setter(screenInstance)
    } else {
      return screenInstance
    }
  })
})

export const addScreenInstanceAfter = action(
  (ptr: number, { screenId, screenInstanceId }: { screenId: string; screenInstanceId: string }) => {
    store.screenInstances = [
      ...store.screenInstances.filter((_, index) => index <= ptr),
      {
        id: screenInstanceId,
        screenId,
        nestedRouteCount: 0,
      },
    ]
  }
)

export const increaseScreenInstancePtr = action(() => {
  store.screenInstancePtr = store.screenInstancePtr + 1
})

export const setScreenInstancePtr = action((ptr: number) => {
  store.screenInstancePtr = ptr
})

export const setScreenEdge = action((screenEdge: ScreenEdge) => {
  store.screenEdge = screenEdge
})

export default store

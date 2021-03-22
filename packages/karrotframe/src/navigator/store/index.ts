import { action, observable, ObservableMap } from 'mobx'
import React from 'react'

import { ScreenComponentProps } from '../ScreenComponentProps'

export interface Screen {
  id: string
  path: string
  Component: React.FC<
    { screenInstanceId: string; as: string } & ScreenComponentProps
  >
}

export interface ScreenInstance {
  id: string
  screenId: string
  nestedRouteCount: number
  present: boolean
  as: string
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
  disableScrollToTop: boolean
  onTopClick?: () => void
}

export type ScreenInstancePromise = {
  resolve: (data: any | null) => void
  popped: boolean
}

export interface ScreenEdge {
  startTime: number | null
  startX: number | null
}

const store = observable<{
  screens: ObservableMap<string, Screen>
  screenInstances: ScreenInstance[]
  screenInstancePointer: number
  screenInstanceOptions: ObservableMap<string, ScreenInstanceOption>
  screenInstancePromises: ObservableMap<string, ScreenInstancePromise>
  screenEdge: ScreenEdge
}>({
  screens: observable.map<string, Screen>({}, { deep: false }),
  screenInstances: [],
  screenInstancePointer: -1,
  screenInstanceOptions: observable.map<string, ScreenInstanceOption>(
    {},
    { deep: false }
  ),
  screenInstancePromises: observable.map<string, ScreenInstancePromise>(
    {},
    { deep: false }
  ),
  screenEdge: {
    startX: null,
    startTime: null,
  },
})

export const setScreenInstanceIn = action(
  (
    pointer: number,
    setter: (screenInstance: ScreenInstance) => ScreenInstance
  ) => {
    store.screenInstances = store.screenInstances.map(
      (screenInstance, screenInstanceIndex) => {
        if (screenInstanceIndex === pointer) {
          return setter(screenInstance)
        } else {
          return screenInstance
        }
      }
    )
  }
)

export const addScreenInstanceAfter = action(
  (
    pointer: number,
    {
      screenId,
      screenInstanceId,
      present,
      as,
    }: {
      screenId: string
      screenInstanceId: string
      present: boolean
      as: string
    }
  ) => {
    store.screenInstances = [
      ...store.screenInstances.filter((_, index) => index <= pointer),
      {
        id: screenInstanceId,
        screenId,
        nestedRouteCount: 0,
        present,
        as,
      },
    ]
  }
)

export const increaseScreenInstancePointer = action(() => {
  store.screenInstancePointer = store.screenInstancePointer + 1
})

export const setScreenInstancePointer = action((pointer: number) => {
  store.screenInstancePointer = pointer
})

export const setScreenEdge = action((screenEdge: ScreenEdge) => {
  store.screenEdge = screenEdge
})

export default store

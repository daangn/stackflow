import React from 'react'
import { createStore } from './createStore'

import { ScreenComponentProps } from '../ScreenComponentProps'

export * from './createStore'
export * from './useStore'

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
  noBorder: boolean
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

export interface Store {
  screens: {
    [screenId: string]: Screen | undefined
  }
  screenInstances: ScreenInstance[]
  screenInstancePtr: number
  screenInstanceOptions: {
    [screenInstanceId: string]: ScreenInstanceOption | undefined
  }
  screenInstancePromises: {
    [screenInstanceId: string]: ScreenInstancePromise | undefined
  }
  screenEdge: ScreenEdge
}

export const store = createStore<Store>(() => ({
  screens: {},
  screenInstances: [],
  screenInstancePtr: -1,
  screenInstanceOptions: {},
  screenInstancePromises: {},
  screenEdge: {
    startX: null,
    startTime: null,
  },
}))

export function setScreen({ screen }: { screen: Screen }) {
  store.setState((prevState) => ({
    ...prevState,
    screens: {
      ...prevState.screens,
      [screen.id]: screen,
    },
  }))
}

export function setScreenInstanceOption({
  screenInstanceId,
  screenInstanceOption,
}: {
  screenInstanceId: string
  screenInstanceOption: ScreenInstanceOption
}) {
  store.setState((prevState) => ({
    ...prevState,
    screenInstanceOptions: {
      ...prevState.screenInstanceOptions,
      [screenInstanceId]: screenInstanceOption,
    },
  }))
}

export function setScreenInstancePromise({
  screenInstanceId,
  screenInstancePromise,
}: {
  screenInstanceId: string
  screenInstancePromise: ScreenInstancePromise
}) {
  store.setState((prevState) => ({
    ...prevState,
    screenInstancePromises: {
      ...prevState.screenInstancePromises,
      [screenInstanceId]: screenInstancePromise,
    },
  }))
}

export function mapScreenInstance({
  ptr,
  mapper,
}: {
  ptr: number
  mapper: (screenInstance: ScreenInstance) => ScreenInstance
}) {
  store.setState((prevState) => ({
    ...prevState,
    screenInstances: prevState.screenInstances.map((si, i) =>
      i === ptr ? mapper(si) : si
    ),
  }))
}

export function insertScreenInstance({
  ptr,
  screenInstance,
}: {
  ptr: number
  screenInstance: {
    id: string
    screenId: string
    present: boolean
    as: string
  }
}) {
  store.setState((prevState) => ({
    ...prevState,
    screenInstances: [
      ...prevState.screenInstances.filter((_, i) => i <= ptr),
      {
        ...screenInstance,
        nestedRouteCount: 0,
      },
    ],
  }))
}

export function increaseScreenInstancePtr() {
  store.setState((prevState) => ({
    ...prevState,
    screenInstancePtr: prevState.screenInstancePtr + 1,
  }))
}

export function setScreenInstancePtr({ ptr }: { ptr: number }) {
  store.setState((prevState) => ({
    ...prevState,
    screenInstancePtr: ptr,
  }))
}

export function setScreenEdge({ screenEdge }: { screenEdge: ScreenEdge }) {
  store.setState((prevState) => ({
    ...prevState,
    screenEdge,
  }))
}

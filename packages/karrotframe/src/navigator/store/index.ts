import React from 'react'
import { createStore, createDispatch } from 'sagen'

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
  screenInstancePointer: number
  screenInstanceOptions: {
    [screenInstanceId: string]: ScreenInstanceOption | undefined
  }
  screenInstancePromises: {
    [screenInstanceId: string]: ScreenInstancePromise | undefined
  }
  screenEdge: ScreenEdge
}

export const store = createStore<Store>({
  screens: {},
  screenInstances: [],
  screenInstancePointer: -1,
  screenInstanceOptions: {},
  screenInstancePromises: {},
  screenEdge: {
    startX: null,
    startTime: null,
  },
})

export const action = store.setAction((prevStore) => ({
  SET_SCREEN: ({ screen }: { screen: Screen }) => {
    const store = prevStore()

    return {
      ...store,
      screens: {
        ...store.screens,
        [screen.id]: screen,
      },
    }
  },
  SET_SCREEN_INSTANCE_OPTION: ({
    screenInstanceId,
    screenInstanceOption,
  }: {
    screenInstanceId: string
    screenInstanceOption: ScreenInstanceOption
  }) => {
    const store = prevStore()

    return {
      ...store,
      screenInstanceOptions: {
        ...store.screenInstanceOptions,
        [screenInstanceId]: screenInstanceOption,
      },
    }
  },
  SET_SCREEN_INSTANCE_PROMISE: ({
    screenInstanceId,
    screenInstancePromise,
  }: {
    screenInstanceId: string
    screenInstancePromise: ScreenInstancePromise
  }) => {
    const store = prevStore()

    return {
      ...store,
      screenInstancePromises: {
        ...store.screenInstancePromises,
        [screenInstanceId]: screenInstancePromise,
      },
    }
  },
  MAP_SCREEN_INSTANCE: ({
    ptr,
    mapper,
  }: {
    ptr: number
    mapper: (screenInstance: ScreenInstance) => ScreenInstance
  }) => {
    const store = prevStore()

    return {
      ...store,
      screenInstances: store.screenInstances.map((si, i) =>
        i === ptr ? mapper(si) : si
      ),
    }
  },
  INSERT_SCREEN_INSTANCE: ({
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
  }) => {
    const store = prevStore()

    return {
      ...store,
      screenInstances: [
        ...store.screenInstances.filter((_, i) => i <= ptr),
        {
          ...screenInstance,
          nestedRouteCount: 0,
        },
      ],
    }
  },
  INC_SCREEN_INSTANCE_PTR: () => {
    const store = prevStore()

    return {
      ...store,
      screenInstancePointer: store.screenInstancePointer + 1,
    }
  },
  SET_SCREEN_INSTANCE_PTR: ({ ptr }: { ptr: number }) => {
    return {
      ...prevStore(),
      screenInstancePointer: ptr,
    }
  },
  SET_SCREEN_EDGE: ({ screenEdge }: { screenEdge: ScreenEdge }) => {
    return {
      ...prevStore(),
      screenEdge,
    }
  },
}))

export const dispatch = createDispatch(store)

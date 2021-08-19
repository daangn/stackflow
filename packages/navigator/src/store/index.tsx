import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import compare from 'react-fast-compare'

import { ScreenComponentProps } from '../ScreenComponentProps'
import { createStore, Store } from './createStore'

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

export interface GlobalState {
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

const StoreContext = createContext<Store<GlobalState>>(null as any)

export const StoreProvider: React.FC = (props) => {
  const store = useMemo(
    () =>
      createStore<GlobalState>(() => ({
        screens: {},
        screenInstances: [],
        screenInstancePtr: -1,
        screenInstanceOptions: {},
        screenInstancePromises: {},
        screenEdge: {
          startX: null,
          startTime: null,
        },
      })),
    []
  )

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}

export function useStoreSelector<V>(selector: (state: GlobalState) => V): V {
  const store = useStore()
  const [value, setValue] = useState(() => selector(store.getState()))

  useEffect(() => {
    const fn = (prevState: GlobalState | null, nextState: GlobalState) => {
      const prevValue = prevState && selector(prevState)
      const nextValue = selector(nextState)

      if (
        (prevValue && !compare(prevValue, nextValue)) ||
        !compare(value, nextValue)
      ) {
        setValue(nextValue)
      }
    }

    fn(null, store.getState())
    const dispose = store.listen(fn, true)

    return () => {
      dispose()
    }
  }, [store, selector, setValue])

  return value
}

export function useStoreActions() {
  const store = useStore()

  const addScreen = useCallback(
    ({ screen }: { screen: Screen }) => {
      store.setState((prevState) => ({
        ...prevState,
        screens: {
          ...prevState.screens,
          [screen.id]: screen,
        },
      }))
    },
    [store]
  )

  const removeScreen = useCallback(
    ({ screenId }: { screenId: string }) => {
      store.setState((prevState) => ({
        ...prevState,
        screens: {
          ...prevState.screens,
          [screenId]: undefined,
        },
      }))
    },
    [store]
  )

  const addScreenInstanceOption = useCallback(
    ({
      screenInstanceId,
      screenInstanceOption,
    }: {
      screenInstanceId: string
      screenInstanceOption: ScreenInstanceOption
    }) => {
      store.setState((prevState) => ({
        ...prevState,
        screenInstanceOptions: {
          ...prevState.screenInstanceOptions,
          [screenInstanceId]: screenInstanceOption,
        },
      }))
    },
    [store]
  )

  const addScreenInstancePromise = useCallback(
    ({
      screenInstanceId,
      screenInstancePromise,
    }: {
      screenInstanceId: string
      screenInstancePromise: ScreenInstancePromise
    }) => {
      store.setState((prevState) => ({
        ...prevState,
        screenInstancePromises: {
          ...prevState.screenInstancePromises,
          [screenInstanceId]: screenInstancePromise,
        },
      }))
    },
    [store]
  )

  const mapScreenInstance = useCallback(
    ({
      ptr,
      mapper,
    }: {
      ptr: number
      mapper: (screenInstance: ScreenInstance) => ScreenInstance
    }) => {
      store.setState((prevState) => ({
        ...prevState,
        screenInstances: prevState.screenInstances.map((si, i) =>
          i === ptr ? mapper(si) : si
        ),
      }))
    },
    [store]
  )

  const insertScreenInstance = useCallback(
    ({
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
    },
    [store]
  )

  const increaseScreenInstancePtr = useCallback(() => {
    store.setState((prevState) => ({
      ...prevState,
      screenInstancePtr: prevState.screenInstancePtr + 1,
    }))
  }, [store])

  const setScreenInstancePtr = useCallback(
    ({ ptr }: { ptr: number }) => {
      store.setState((prevState) => ({
        ...prevState,
        screenInstancePtr: ptr,
      }))
    },
    [store]
  )

  const setScreenEdge = useCallback(
    ({ screenEdge }: { screenEdge: ScreenEdge }) => {
      store.setState((prevState) => ({
        ...prevState,
        screenEdge,
      }))
    },
    [store]
  )

  return useMemo(
    () => ({
      addScreen,
      removeScreen,
      addScreenInstanceOption,
      addScreenInstancePromise,
      mapScreenInstance,
      insertScreenInstance,
      increaseScreenInstancePtr,
      setScreenInstancePtr,
      setScreenEdge,
    }),
    [
      addScreen,
      removeScreen,
      addScreenInstanceOption,
      addScreenInstancePromise,
      mapScreenInstance,
      insertScreenInstance,
      increaseScreenInstancePtr,
      setScreenInstancePtr,
      setScreenEdge,
    ]
  )
}

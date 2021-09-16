import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import compare from 'react-fast-compare'

import { createStore, Store } from './createStore'

export interface IScreenInstanceOption {
  navbar: INavbarOptions
}

export interface INavbarOptions {
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

export interface GlobalState {
  screenInstanceOptions: {
    [screenInstanceId: string]: IScreenInstanceOption | undefined
  }
}

const StoreContext = createContext<Store<GlobalState>>(null as any)

export const StoreProvider: React.FC = (props) => {
  const store = useMemo(
    () =>
      createStore<GlobalState>(() => ({
        screenInstanceOptions: {},
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

  const addScreenInstanceOption = useCallback(
    ({
      screenInstanceId,
      screenInstanceOption,
    }: {
      screenInstanceId: string
      screenInstanceOption: IScreenInstanceOption
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

  return useMemo(
    () => ({
      addScreenInstanceOption,
    }),
    [addScreenInstanceOption]
  )
}

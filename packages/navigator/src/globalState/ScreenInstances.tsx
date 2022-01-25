import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { usePlugins } from './Plugins'

export interface IScreenInstance {
  id: string
  screenId: string
  nestedRouteCount: number
  present: boolean
  as: string
}
export interface IScreenInstancePromise {
  resolve: (data: any | null) => void
  onNextPagePopped?: (from: string, data: any) => void
}
export interface IScreenInstancePromiseMap {
  [key: string]: IScreenInstancePromise
}

const ContextScreenInstances = createContext<{
  screenInstances: IScreenInstance[]
  screenInstancePtr: number
  screenInstancePromiseMap: IScreenInstancePromiseMap
  insertScreenInstance: (args: {
    ptr: number
    screenInstance: {
      id: string
      screenId: string
      present: boolean
      as: string
    }
  }) => void
  mapScreenInstance: (args: {
    ptr: number
    mapper: (screenInstance: IScreenInstance) => IScreenInstance
  }) => void
  incScreenInstancePtr: () => void
  setScreenInstancePtr: (ptr: number) => void
  addScreenInstancePromise: (args: {
    screenInstanceId: string
    screenInstancePromise: IScreenInstancePromise
  }) => void
}>(null as any)

export const ProviderScreenInstances: React.FC = ({ children }) => {
  const { lifecycleHooks } = usePlugins()

  const [screenInstances, setScreenInstances] = useState<IScreenInstance[]>([])
  const [screenInstancePtr, setScreenInstancePtr] = useState<number>(-1)
  const [screenInstancePromiseMap, setScreenInstancePromiseMap] =
    useState<IScreenInstancePromiseMap>({})

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
      lifecycleHooks.forEach((hook) => {
        const context = {
          ptr,
          screenInstance,
          screenInstances,
          options: {
            setScreenInstances,
            setScreenInstancePtr
          },
        }
        hook?.beforeInsertScreenInstance?.(context)
      })

      setScreenInstances((screenInstances) => [
        ...screenInstances.filter((_, i) => i <= ptr),
        {
          ...screenInstance,
          nestedRouteCount: 0,
        },
      ])

      lifecycleHooks.forEach((hook) => {
        const context = {
          ptr,
          screenInstance,
          screenInstances,
          options: {
            setScreenInstances,
            setScreenInstancePtr
          },
        }
        hook?.onInsertScreenInstance?.(context)
      })
    },
    [setScreenInstances, screenInstances]
  )

  const mapScreenInstance = useCallback(
    ({
      ptr,
      mapper,
    }: {
      ptr: number
      mapper: (screenInstance: IScreenInstance) => IScreenInstance
    }) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          ptr,
          screenInstances,
          options: {
            mapperScreenInstance: mapper,
          },
        }
        hook?.beforeMapScreenInstance?.(context)
      })

      setScreenInstances((screenInstances) =>
        screenInstances.map((si, i) => (i === ptr ? mapper(si) : si))
      )

      lifecycleHooks.forEach((hook) => {
        const context = {
          ptr,
          screenInstances,
          options: {
            mapperScreenInstance: mapper,
          },
        }
        hook?.onMapScreenInstance?.(context)
      })

    },
    [setScreenInstances]
  )

  const incScreenInstancePtr = useCallback(() => {
    setScreenInstancePtr((ptr) => ptr + 1)
  }, [setScreenInstancePtr])

  const addScreenInstancePromise = useCallback(
    ({
      screenInstanceId,
      screenInstancePromise,
    }: {
      screenInstanceId: string
      screenInstancePromise: IScreenInstancePromise
    }) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          screenInstancePtr,
          screenInstances,
          screenInstanceId,
          screenInstancePromise,
        }
        hook?.beforeAddScreenInstancePromise?.(context)
      })

      setScreenInstancePromiseMap((screenInstancePromiseMap) => ({
        ...screenInstancePromiseMap,
        [screenInstanceId]: screenInstancePromise,
      }))
      lifecycleHooks.forEach((hook) => {
        const context = {
          screenInstancePtr,
          screenInstances,
          screenInstanceId,
          screenInstancePromise,
        }
        hook?.onAddScreenInstancePromise?.(context)
      })
    },
    [setScreenInstancePromiseMap]
  )

  const value = useMemo(
    () => ({
      screenInstances,
      screenInstancePromiseMap,
      screenInstancePtr,
      insertScreenInstance,
      mapScreenInstance,
      incScreenInstancePtr,
      setScreenInstancePtr,
      addScreenInstancePromise,
    }),
    [
      screenInstances,
      screenInstancePromiseMap,
      screenInstancePtr,
      insertScreenInstance,
      mapScreenInstance,
      incScreenInstancePtr,
      setScreenInstancePtr,
      addScreenInstancePromise,
    ]
  )

  return (
    <ContextScreenInstances.Provider value={value}>
      {children}
    </ContextScreenInstances.Provider>
  )
}

export function useScreenInstances() {
  return useContext(ContextScreenInstances)
}

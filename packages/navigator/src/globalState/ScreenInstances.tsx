import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

export interface IScreenInstance {
  id: string
  screenId: string
  nestedRouteCount: number
  present: boolean
  as: string
}
export interface IScreenInstancePromise {
  resolve: (data: any | null) => void
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

export const ProviderScreenInstances: React.FC = (props) => {
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
      setScreenInstances((screenInstances) => [
        ...screenInstances.filter((_, i) => i <= ptr),
        {
          ...screenInstance,
          nestedRouteCount: 0,
        },
      ])
    },
    [setScreenInstances]
  )

  const mapScreenInstance = useCallback(
    ({
      ptr,
      mapper,
    }: {
      ptr: number
      mapper: (screenInstance: IScreenInstance) => IScreenInstance
    }) => {
      setScreenInstances((screenInstances) =>
        screenInstances.map((si, i) => (i === ptr ? mapper(si) : si))
      )
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
      setScreenInstancePromiseMap((screenInstancePromiseMap) => ({
        ...screenInstancePromiseMap,
        [screenInstanceId]: screenInstancePromise,
      }))
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
      {props.children}
    </ContextScreenInstances.Provider>
  )
}

export function useScreenInstances() {
  return useContext(ContextScreenInstances)
}

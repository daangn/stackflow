import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react'

const UniqueIdContext = createContext<{
  counter: number
  increase: () => void
}>(null as any)

export const UniqueIdProvider: React.FC = (props) => {
  const [counter, increase] = useReducer((i) => i + 1, 0)

  return (
    <UniqueIdContext.Provider
      value={useMemo(
        () => ({
          counter,
          increase,
        }),
        [counter, increase]
      )}
    >
      {props.children}
    </UniqueIdContext.Provider>
  )
}

export function useUniqueId() {
  const { counter, increase } = useContext(UniqueIdContext)

  const uid = useCallback(() => {
    increase()
    return String(counter)
  }, [counter, increase])

  return useMemo(
    () => ({
      uid,
    }),
    [uid]
  )
}

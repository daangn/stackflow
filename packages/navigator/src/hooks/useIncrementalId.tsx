import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from 'react'

const IncrementalIdContext = createContext<() => string>(null as any)

export const ProviderIncrementalId: React.FC = (props) => {
  const [counter, increase] = useReducer((i) => i + 1, 0)

  const id = useCallback(() => {
    increase()
    return String(counter)
  }, [counter, increase])

  return (
    <IncrementalIdContext.Provider value={id}>
      {props.children}
    </IncrementalIdContext.Provider>
  )
}

export function useIncrementalId() {
  return useContext(IncrementalIdContext)
}

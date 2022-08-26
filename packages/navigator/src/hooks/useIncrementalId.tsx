import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from 'react'

const ContextIncrementalId = createContext<() => string>(null as any)

interface ProviderIncrementalIdProps {
  children: React.ReactNode
}

export const ProviderIncrementalId: React.FC<ProviderIncrementalIdProps> = (
  props: ProviderIncrementalIdProps
) => {
  const [counter, increase] = useReducer((i) => i + 1, 0)

  const id = useCallback(() => {
    increase()
    return String(counter)
  }, [counter, increase])

  return (
    <ContextIncrementalId.Provider value={id}>
      {props.children}
    </ContextIncrementalId.Provider>
  )
}

export function useIncrementalId() {
  return useContext(ContextIncrementalId)
}

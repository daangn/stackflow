import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'

const UniqueIdContext = createContext<React.MutableRefObject<number>>(
  null as any
)

export const UniqueIdProvider: React.FC = (props) => {
  const counterRef = useRef(0)

  return (
    <UniqueIdContext.Provider value={counterRef}>
      {props.children}
    </UniqueIdContext.Provider>
  )
}

export function useUniqueId() {
  const counterRef = useContext(UniqueIdContext)

  const uid = useCallback(() => {
    counterRef.current += 1
    return String(counterRef.current)
  }, [counterRef])

  return useMemo(
    () => ({
      uid,
    }),
    [uid]
  )
}

import { useCallback, useMemo, useState } from 'react'
import compare from 'react-fast-compare'

export function useDeepState<T>(initialState: T): [T, (nextState: T) => void] {
  const [state, _setState] = useState<T>(initialState)

  const setState = useCallback(
    (nextState: T) => {
      if (!compare(state, nextState)) {
        _setState(nextState)
      }
    },
    [_setState]
  )

  return useMemo(() => [state, setState], [state, setState])
}

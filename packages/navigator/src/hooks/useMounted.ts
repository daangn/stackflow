import { useEffect, useReducer } from 'react'
import { nextTick } from '../helpers'

export function useMounted() {
  const [mounted, mount] = useReducer(() => true, false)
  useEffect(() => {
    nextTick(() => mount())
  }, [mount])

  return mounted
}

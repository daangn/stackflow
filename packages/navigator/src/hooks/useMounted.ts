import { useEffect, useReducer } from 'react'
import { nextTick } from '../helpers'

interface Options {
  afterTick?: boolean
}

export function useMounted(options?: Options) {
  const [mounted, mount] = useReducer(() => true, false)

  useEffect(() => {
    if (options?.afterTick) {
      nextTick(() => mount())
      return
    }

    mount()
  }, [mount, options])

  return mounted
}

import { useCallback, useEffect, useReducer } from 'react'
import { nextTick } from '../helpers'

interface Options {
  afterTick?: boolean
  manualMount?: boolean
}

export function useMounted(options?: Options): [boolean, () => void] {
  const [mounted, mount] = useReducer(() => true, false)

  useEffect(() => {
    if (mounted) return

    if (options?.manualMount) return

    if (options?.afterTick) {
      nextTick(() => mount())
      return
    }

    mount()
  }, [mount, options, mounted])

  const manualMount = useCallback(() => {
    if (options?.afterTick) {
      nextTick(() => mount())
      return
    }

    mount()
  }, [options, mount])

  return [mounted, manualMount]
}

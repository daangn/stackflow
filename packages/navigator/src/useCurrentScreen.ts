import { useMemo } from 'react'

import { useScreenInstance } from './components/Stack.ContextScreenInstance'

export function useCurrentScreen() {
  const { isTop, isRoot } = useScreenInstance()

  return useMemo(
    () => ({
      isTop,
      isRoot,
    }),
    [isTop, isRoot]
  )
}

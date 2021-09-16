import { useMemo } from 'react'

import { useScreenInstance } from './components/Stack.ScreenInstanceContext'

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

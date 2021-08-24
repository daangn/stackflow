import { useMemo } from 'react'

import { useScreenInstance } from './contexts'

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

import { useMemo } from 'react'

import { useScreenInstanceInfo } from './contexts'

export function useCurrentScreen() {
  const { screenInstanceId, isTop, isRoot } = useScreenInstanceInfo()

  return useMemo(
    () => ({
      screenInstanceId,
      isTop,
      isRoot,
    }),
    [screenInstanceId, isTop, isRoot]
  )
}

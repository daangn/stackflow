import { useMemo } from 'react'
import { match, matchPath } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

export function useScreenParams<T extends {} = {}>(): match<T>['params'] | null {
  const { location, path } = useScreenInstanceInfo()

  return useMemo(() => matchPath<T>(location, path)?.params ?? null, [location, path])
}

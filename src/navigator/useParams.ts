import { useMemo } from 'react'
import { match, matchPath } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

export function useParams<T extends {} = {}>(): match<T>['params'] | null {
  const { as, path } = useScreenInstanceInfo()
  return useMemo(() => matchPath<T>(as, path)?.params ?? null, [as, path])
}

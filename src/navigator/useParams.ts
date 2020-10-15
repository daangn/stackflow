import { match, useRouteMatch } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

export function useParams<T extends {} = {}>(): match<T>['params'] | null {
  const info = useScreenInstanceInfo()
  const match = useRouteMatch<T>({
    path: info.path,
  })

  return match?.params ?? null
}

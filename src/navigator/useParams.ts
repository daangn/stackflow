import { useRouteMatch } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

export function useParams() {
  const info = useScreenInstanceInfo()
  const match = useRouteMatch({
    path: info.path,
  })

  return match?.params || {}
}

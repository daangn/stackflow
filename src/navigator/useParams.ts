import { useRouteMatch } from 'react-router-dom'

import { useScreenInfo } from './contexts'

export function useParams() {
  const info = useScreenInfo()
  const match = useRouteMatch({
    path: info.path,
  })

  return match?.params || {}
}

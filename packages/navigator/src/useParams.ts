import { useMemo } from 'react'
import { matchPath } from 'react-router-dom'

import { useScreenInstance } from './components/Stack.ContextScreenInstance'

export function useParams() {
  const { as, screenPath } = useScreenInstance()

  return useMemo(() => {
    return matchPath(screenPath, as)?.params ?? {}
  }, [as, screenPath])
}

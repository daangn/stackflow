import qs from 'querystring'
import { useEffect, useState } from 'react'
import { match, useLocation } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

export function useQueryParams<T extends {} = {}>(): match<T>['params'] {
  const location = useLocation()
  const info = useScreenInstanceInfo()

  const search: T = qs.parse(location.search.split('?')[1]) as any

  const [state, setState] = useState<T>({} as T)

  useEffect(() => {
    if (location.pathname === info.path) {
      setState(search)
    }
  }, [location.pathname, location.search])

  return state
}

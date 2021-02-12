import qs from 'querystring'
import { useMemo } from 'react'
import { match, useLocation } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

const getParsedQuerystring = <T extends {} = {}>({
  screenPath,
}: {
  screenPath: string
}) => {
  let prevSearch = ''
  let prevResult: T = {} as any

  return ({
    currentPath,
    search,
  }: {
    currentPath: string
    search: string
  }): T => {
    if (currentPath === screenPath && prevSearch !== search) {
      prevResult = qs.parse(search.split('?')[1]) as T
      prevSearch = search
    }
    return prevResult
  }
}

export function useQueryParams<T extends {} = {}>(): match<T>['params'] {
  const location = useLocation()
  const info = useScreenInstanceInfo()

  const _parseQuery = useMemo(
    () => getParsedQuerystring<T>({ screenPath: info.as }),
    [info.as]
  )
  return useMemo(
    () =>
      _parseQuery({ currentPath: location.pathname, search: location.search }),
    [location.pathname, location.search]
  )
}

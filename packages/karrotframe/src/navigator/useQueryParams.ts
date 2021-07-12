import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

const getParsedQuerystring = <T extends { [key in keyof T]: string } = {}>({
  screenPath,
}: {
  screenPath: string
}) => {
  let prevSearch = ''
  let prevResult = {} as T

  return ({
    currentPath,
    search,
  }: {
    currentPath: string
    search: string
  }): T => {
    if (currentPath === screenPath && prevSearch !== search) {
      prevResult = Object.fromEntries(
        new URLSearchParams(search).entries()
      ) as T
      prevSearch = search
    }
    return prevResult
  }
}

export function useQueryParams<
  T extends { [key in keyof T]: string } = {}
>(): Partial<T> {
  const location = useLocation()
  const info = useScreenInstanceInfo()

  return useMemo(() => {
    const parseQuery = getParsedQuerystring<T>({ screenPath: info.as })
    return parseQuery({
      currentPath: location.pathname,
      search: location.search,
    })
  }, [info.as, location.pathname, location.search])
}

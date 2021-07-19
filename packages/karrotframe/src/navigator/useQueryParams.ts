import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

export function useQueryParams<
  T extends { [key in keyof T]: string } = {}
>(): Partial<T> {
  const location = useLocation()
  const { as } = useScreenInstanceInfo()

  const parse = useMemo(() => {
    let prevParams: Partial<T> = {}

    return ({ pathname, search }: { pathname: string; search: string }) => {
      if (pathname === as) {
        prevParams = Object.fromEntries(
          new URLSearchParams(search).entries()
        ) as Partial<T>
      }
      return prevParams
    }
  }, [as])

  return useMemo(
    () =>
      parse({
        pathname: location.pathname,
        search: location.search,
      }),
    [location.pathname, location.search]
  )
}

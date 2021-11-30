import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useScreenInstance } from './components/Stack.ContextScreenInstance'

export function useQueryParams<
  T extends { [key in keyof T]: string } = {}
>(options?: { ignoreNestedRoutes?: boolean }): Partial<T> {
  const ignoreNestedRoutes = !!options?.ignoreNestedRoutes

  const location = useLocation()
  const { as } = useScreenInstance()

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

  const queryParams = useMemo(
    () =>
      parse({
        pathname: location.pathname,
        search: location.search,
      }),
    [
      ignoreNestedRoutes,
      ...(ignoreNestedRoutes ? [as] : [location.pathname, location.search]),
    ]
  )

  return queryParams
}

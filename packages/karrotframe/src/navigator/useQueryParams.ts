import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

export function useQueryParams<
  T extends { [key in keyof T]: string } = {}
>(): Partial<T> {
  const location = useLocation()
  const { as, path } = useScreenInstanceInfo()

  return useMemo(
    () =>
      (Object.fromEntries(
        new URLSearchParams(location.search).entries()
      ) as Partial<T>) ?? {},
    [as, path]
  )
}

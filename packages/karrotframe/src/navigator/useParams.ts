import { useMemo } from 'react'
import { matchPath } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'

export function useParams<
  T extends { [key in keyof T]: string } = {}
>(): Partial<T> {
  const { as, path } = useScreenInstanceInfo()
  return useMemo(() => matchPath<T>(as, path)?.params ?? {}, [as, path])
}

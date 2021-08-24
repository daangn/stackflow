import { useMemo } from 'react'
import { matchPath } from 'react-router-dom'

import { useScreenInstance } from './contexts'

export function useParams<
  T extends { [key in keyof T]: string } = {}
>(): Partial<T> {
  const { as, path } = useScreenInstance()
  return useMemo(() => matchPath<T>(as, path)?.params ?? {}, [as, path])
}

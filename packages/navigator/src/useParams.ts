import { useMemo } from 'react'
import { matchPath } from 'react-router-dom'

import { useScreenInstance } from './components/Stack.ContextScreenInstance'

export function useParams<
  T extends { [key in keyof T]: string } = {}
>(): Partial<T> {
  const { as, screenPath } = useScreenInstance()

  return useMemo(
    () => matchPath<T>(as, screenPath)?.params ?? {},
    [as, screenPath]
  )
}

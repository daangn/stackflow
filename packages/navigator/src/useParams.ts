import { useMemo } from 'react'
import { matchPath, useLocation } from 'react-router-dom'

import { useScreenInstance } from './components/Stack.ScreenInstanceContext'

export function useParams<
  T extends { [key in keyof T]: string } = {}
>(): Partial<T> {
  const { pathname } = useLocation()
  const { as } = useScreenInstance()

  return useMemo(() => matchPath<T>(as, pathname)?.params ?? {}, [as, pathname])
}

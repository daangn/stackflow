import { useCallback } from 'react'
import { useHistory } from 'react-router-dom'

import { appendSearch, generateScreenInstanceId } from '../utils'
import { useScreenInstanceInfo } from './contexts'
import store from './store'

export function useNavigator() {
  const history = useHistory()
  const screenInfo = useScreenInstanceInfo()

  const push = useCallback(
    <T = object>(to: string): Promise<T | null> =>
      new Promise((resolve) => {
        const [pathname, search] = to.split('?')
        const _si = generateScreenInstanceId()

        history.push(pathname + '?' + appendSearch(search || null, { _si }))

        store.screenInstancePromises.set(screenInfo.screenInstanceId, resolve)
      }),
    []
  )

  const replace = useCallback((to: string) => {
    const [pathname, search] = to.split('?')
    const _si = generateScreenInstanceId()

    history.replace(pathname + '?' + appendSearch(search, { _si }))
  }, [])

  const pop = useCallback((depth = 1) => {
    const targetScreenInstance = store.screenInstances[store.screenInstancePointer - depth]

    const n = store.screenInstances
      .filter((_, idx) => idx > store.screenInstancePointer - depth && idx <= store.screenInstancePointer)
      .map((screenInstance) => screenInstance.nestedRouteCount)
      .reduce((acc, current) => acc + current + 1, 0)

    history.go(-n)

    const send = <T = object>(data: T) => {
      if (targetScreenInstance) {
        store.screenInstancePromises.get(targetScreenInstance.id)?.(data ?? null)
      }
    }

    return { send }
  }, [])

  return { push, replace, pop }
}

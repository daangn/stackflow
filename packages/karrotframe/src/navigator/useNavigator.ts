import { useCallback } from 'react'
import { useHistory } from 'react-router-dom'

import { appendSearch, generateScreenInstanceId } from '../utils'
import { useScreenInstanceInfo } from './contexts'
import store from './store'

export function useNavigator() {
  const history = useHistory()
  const screenInfo = useScreenInstanceInfo()

  const push = useCallback(
    <T = object>(
      to: string,
      options?: {
        present?: boolean
      }
    ): Promise<T | null> =>
      new Promise((resolve) => {
        const [pathname, search] = to.split('?')
        const _si = generateScreenInstanceId()

        const params: {
          _si: string
          _present?: 'true'
        } = {
          _si,
        }

        if (options?.present) {
          params._present = 'true'
        }

        history.push(pathname + '?' + appendSearch(search || null, params))

        store.screenInstancePromises.set(screenInfo.screenInstanceId, {
          resolve,
          popped: false,
        })
      }),
    []
  )

  const replace = useCallback((to: string) => {
    const [pathname, search] = to.split('?')
    const _si = generateScreenInstanceId()

    history.replace(pathname + '?' + appendSearch(search, { _si }))
  }, [])

  const pop = useCallback((depth = 1) => {
    const targetScreenInstance =
      store.screenInstances[store.screenInstancePointer - depth]

    const n = store.screenInstances
      .filter(
        (_, idx) =>
          idx > store.screenInstancePointer - depth &&
          idx <= store.screenInstancePointer
      )
      .map((screenInstance) => screenInstance.nestedRouteCount)
      .reduce((acc, current) => acc + current + 1, 0)

    const promise = store.screenInstancePromises.get(targetScreenInstance.id)
    let data: any = null

    const dispose = history.listen(() => {
      dispose()

      if (targetScreenInstance) {
        promise?.resolve(data ?? null)
      }
    })

    history.go(-n)

    const send = <T = object>(d: T) => {
      data = d as any
      if (promise) {
        promise.popped = true
      }
    }

    return { send }
  }, [])

  return { push, replace, pop }
}

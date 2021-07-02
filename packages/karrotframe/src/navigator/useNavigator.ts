import { useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { appendSearch, generateScreenInstanceId } from '../utils'
import { useScreenInstanceInfo } from './contexts'
import store from './store'
import qs from 'querystring'

export function useNavigator() {
  const history = useHistory()
  const location = useLocation()
  const screenInfo = useScreenInstanceInfo()

  const [, search] = location.search.split('?')
  const queryParams = qs.parse(search) as {
    _si?: string
    _present?: 'true'
  }

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

  const replace = useCallback(
    (
      to: string,
      options?: {
        animate?: boolean
      }
    ) => {
      const [pathname, search] = to.split('?')

      history.replace(
        pathname +
          '?' +
          appendSearch(search, {
            ...(queryParams._si
              ? {
                  _si: options?.animate
                    ? generateScreenInstanceId()
                    : queryParams._si,
                }
              : null),
            ...(queryParams._present
              ? {
                  _present: 'true',
                }
              : null),
          })
      )
    },
    [queryParams]
  )

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

    const send = <T = object>(d: T) => {
      data = d as any
      if (promise) {
        promise.popped = true
      }
    }

    setTimeout(() => history.go(-n), 0)

    return { send }
  }, [])

  return { push, replace, pop }
}

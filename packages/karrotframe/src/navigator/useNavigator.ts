import { useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { appendSearch, generateScreenInstanceId } from '../utils'
import { useScreenInstanceInfo } from './contexts'
import { action, dispatch, store } from './store'
import qs from 'querystring'

export function useNavigator() {
  const history = useHistory()
  const location = useLocation()
  const screenInfo = useScreenInstanceInfo()

  const [, search] = location.search.split('?')
  const prevQueryParams = qs.parse(search) as {
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

        setTimeout(() => {
          history.push(pathname + '?' + appendSearch(search || null, params))
        }, 0)

        dispatch(action.SET_SCREEN_INSTANCE_PROMISE, {
          screenInstanceId: screenInfo.screenInstanceId,
          screenInstancePromise: {
            resolve,
            popped: false,
          },
        })
      }),
    [screenInfo]
  )

  const replace = useCallback(
    (
      to: string,
      options?: {
        animate?: boolean
      }
    ) => {
      const [pathname, search] = to.split('?')

      setTimeout(() => {
        history.replace(
          pathname +
            '?' +
            appendSearch(search, {
              ...(prevQueryParams._si
                ? {
                    _si: options?.animate
                      ? generateScreenInstanceId()
                      : prevQueryParams._si,
                  }
                : null),
              ...(prevQueryParams._present
                ? {
                    _present: 'true',
                  }
                : null),
            })
        )
      }, 0)
    },
    [prevQueryParams]
  )

  const pop = useCallback((depth = 1) => {
    const state = store.getState()

    const targetScreenInstance =
      state.screenInstances[state.screenInstancePointer - depth]

    const n = state.screenInstances
      .filter(
        (_, idx) =>
          idx > state.screenInstancePointer - depth &&
          idx <= state.screenInstancePointer
      )
      .map((screenInstance) => screenInstance.nestedRouteCount)
      .reduce((acc, current) => acc + current + 1, 0)

    const promise = state.screenInstancePromises[targetScreenInstance.id]
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

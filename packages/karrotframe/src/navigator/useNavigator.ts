import { useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { useScreenInstanceInfo } from './contexts'
import {
  generateScreenInstanceId,
  getNavigatorParams,
  NavigatorParamKeys,
} from './helpers'
import { setScreenInstancePromise, store } from './store'

export function useNavigator() {
  const history = useHistory()
  const location = useLocation()
  const screenInfo = useScreenInstanceInfo()

  const searchParams = new URLSearchParams(location.search)
  const { present, screenInstanceId } = getNavigatorParams(searchParams)

  const push = useCallback(
    <T = object>(
      to: string,
      options?: {
        present?: boolean
      }
    ): Promise<T | null> =>
      new Promise((resolve) => {
        const { pathname, searchParams } = new URL(to, /* dummy */ 'file://')

        searchParams.set(
          NavigatorParamKeys.screenInstanceId,
          generateScreenInstanceId()
        )

        if (options?.present) {
          searchParams.set(NavigatorParamKeys.present, 'true')
        }

        setScreenInstancePromise({
          screenInstanceId: screenInfo.screenInstanceId,
          screenInstancePromise: {
            resolve,
            popped: false,
          },
        })

        history.push(`${pathname}?${searchParams.toString()}`)
      }),
    [history, screenInfo]
  )

  const replace = useCallback(
    (
      to: string,
      options?: {
        animate?: boolean
      }
    ) => {
      const { pathname, searchParams } = new URL(to, /* dummy */ 'file://')

      if (options?.animate) {
        searchParams.set(
          NavigatorParamKeys.screenInstanceId,
          generateScreenInstanceId()
        )
      } else {
        if (screenInstanceId) {
          searchParams.set(
            NavigatorParamKeys.screenInstanceId,
            screenInstanceId
          )
        }
        if (present) {
          searchParams.set(NavigatorParamKeys.present, 'true')
        }
      }

      // setTimeout(() => {
      history.replace(`${pathname}?${searchParams.toString()}`)
      // }, 0)
    },
    [history, screenInstanceId, present]
  )

  const pop = useCallback(
    (depth = 1) => {
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
    },
    [history]
  )

  return { push, replace, pop }
}

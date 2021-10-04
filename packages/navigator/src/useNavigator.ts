import { useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { useScreenInstance } from './components/Stack.ContextScreenInstance'
import { useScreenInstances } from './globalState'
import {
  makeNavigatorSearchParams,
  parseNavigatorSearchParams,
} from './helpers'
import { useIncrementalId } from './hooks'

export function useNavigator() {
  const history = useHistory()
  const location = useLocation()
  const screenInfo = useScreenInstance()
  const makeId = useIncrementalId()

  const {
    screenInstances,
    screenInstancePtr,
    screenInstancePromiseMap,
    addScreenInstancePromise,
  } = useScreenInstances()

  const navigatorSearchParams = parseNavigatorSearchParams(location.search)
  const { present, screenInstanceId } = navigatorSearchParams.toObject()

  const push = useCallback(
    <T = object>(
      to: string,
      options?: {
        /**
         * Bottom to top animation (iOS only)
         */
        present?: boolean
      }
    ): Promise<T | null> =>
      new Promise((resolve) => {
        const { pathname, searchParams } = new URL(to, /* dummy */ 'file://')

        const navigatorSearchParams = makeNavigatorSearchParams(searchParams, {
          screenInstanceId: makeId(),
          present: options?.present,
        })

        addScreenInstancePromise({
          screenInstanceId: screenInfo.screenInstanceId,
          screenInstancePromise: {
            resolve,
          },
        })

        history.push(`${pathname}?${navigatorSearchParams.toString()}`)
      }),
    [screenInfo, history]
  )

  const replace = useCallback(
    (
      to: string,
      options?: {
        /**
         * Animate when replaced
         */
        animate?: boolean
      }
    ) => {
      const { pathname, searchParams } = new URL(to, /* dummy */ 'file://')

      const navigatorSearchParams = makeNavigatorSearchParams(searchParams, {
        screenInstanceId: options?.animate ? makeId() : screenInstanceId,
        present,
      })

      history.replace(`${pathname}?${navigatorSearchParams.toString()}`)
    },
    [history, screenInstanceId, present]
  )

  const pop = useCallback(
    (depth = 1) => {
      const targetScreenInstance = screenInstances[screenInstancePtr - depth]

      const backwardCount = screenInstances
        .filter(
          (_, idx) =>
            idx > screenInstancePtr - depth && idx <= screenInstancePtr
        )
        .map((screenInstance) => screenInstance.nestedRouteCount)
        .reduce((acc, current) => acc + current + 1, 0)

      const targetPromise =
        targetScreenInstance &&
        screenInstancePromiseMap[targetScreenInstance.id]
      let _data: any = null

      const dispose = history.listen(() => {
        dispose()

        if (targetScreenInstance) {
          targetPromise?.resolve(_data ?? null)
        }
      })

      /**
       * Send data to `await push()`
       */
      function send<T = object>(
        /**
         * Payload
         */
        data: T
      ) {
        _data = data
      }

      Promise.resolve().then(() => {
        history.go(-backwardCount)
      })

      return {
        send,
      }
    },
    [screenInstances, screenInstancePtr, screenInstancePromiseMap, history]
  )

  return useMemo(
    () => ({
      push,
      replace,
      pop,
    }),
    [push, replace, pop]
  )
}

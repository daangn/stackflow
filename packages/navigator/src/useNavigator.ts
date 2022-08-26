import { useCallback, useMemo, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useScreenInstance } from './components/Stack.ContextScreenInstance'
import { useScreenInstances } from './globalState'
import { usePlugins } from './globalState/Plugins'
import {
  makeNavigatorSearchParams,
  nextTick,
  parseNavigatorSearchParams,
} from './helpers'
import { useIncrementalId } from './hooks'
import { useAnimationContext } from './globalState/Animation'

export function useNavigator() {
  const location = useLocation()
  const screenInfo = useScreenInstance()
  const makeId = useIncrementalId()
  const { lifecycleHooks } = usePlugins()
  const navigate = useNavigate()

  const {
    screenInstances,
    screenInstancePtr,
    screenInstancePromiseMap,
    addScreenInstancePromise,
  } = useScreenInstances()

  const [depth, setDepth] = useState(0)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const targetScreenInstance = screenInstances[screenInstancePtr - depth]

    const targetPromise =
      targetScreenInstance && screenInstancePromiseMap[targetScreenInstance.id]

    if (targetScreenInstance) {
      targetPromise?.resolve(data)
    }
  }, [location, depth, data])

  const { activeAnimation } = useAnimationContext()

  const navigatorSearchParams = parseNavigatorSearchParams(location.search)
  const { present, screenInstanceId } = navigatorSearchParams.toObject()

  const currentScreenInstance = useMemo(
    () => screenInstances[screenInstancePtr],
    [screenInstances, screenInstancePtr]
  )

  const beforePush = useCallback(
    (to: string) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          to,
          screenInstances,
          screenInstancePtr,
          options: {
            push,
            replace,
            pop,
          },
        }
        hook?.beforePush?.(context)
      })
    },
    [lifecycleHooks]
  )

  const onPushed = useCallback(
    (to: string) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          to,
          screenInstances,
          screenInstancePtr,
          options: {
            push,
            replace,
            pop,
          },
        }
        hook?.onPushed?.(context)
      })
    },
    [lifecycleHooks]
  )

  const beforeReplace = useCallback(
    (to: string) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          to,
          options: {
            push,
            replace,
            pop,
          },
        }
        hook?.beforeReplace?.(context)
      })
    },
    [lifecycleHooks]
  )

  const onReplaced = useCallback(
    (to: string) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          to,
          options: {
            push,
            replace,
            pop,
          },
        }
        hook?.onReplaced?.(context)
      })
    },
    [lifecycleHooks]
  )

  const push = useCallback(
    <T = object>(
      to: string,
      options?: {
        /**
         * Bottom to top animation (iOS only)
         */
        present?: boolean
        /**
         * activate screen switch animation
         */
        animate?: boolean
      }
    ): Promise<T | null> =>
      new Promise(async (resolve) => {
        await beforePush(to)
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
        onPushed(to)
        const animate = options?.animate ?? true
        activeAnimation(animate)
        navigate(`${pathname}?${navigatorSearchParams.toString()}`)
      }),
    [screenInfo]
  )

  const replace = useCallback(
    (
      to: string,
      options?: {
        /**
         * activate screen switch animation
         */
        animate?: boolean
      }
    ) => {
      beforeReplace(to)
      const { pathname, searchParams } = new URL(to, /* dummy */ 'file://')

      const navigatorSearchParams = makeNavigatorSearchParams(searchParams, {
        screenInstanceId: makeId(),
        present,
      })

      onReplaced(to)
      nextTick(() => {
        activeAnimation(!!options?.animate)
        navigate(`${pathname}?${navigatorSearchParams.toString()}`, {
          replace: true,
        })
      })
    },
    [screenInstanceId, present]
  )

  const beforePop = useCallback(() => {
    lifecycleHooks.forEach((hook) => {
      const context = {
        from: currentScreenInstance?.as,
        screenInstances,
        screenInstancePtr,
        options: {
          push,
          replace,
          pop,
        },
      }
      hook?.beforePop?.(context)
    })
  }, [lifecycleHooks])

  const onPopped = useCallback(() => {
    lifecycleHooks.forEach((hook) => {
      const context = {
        from: currentScreenInstance?.as,
        screenInstances,
        screenInstancePtr,
        options: {
          push,
          replace,
          pop,
        },
      }
      hook?.onPopped?.(context)
    })
  }, [lifecycleHooks])

  const onPoppedWithData = useCallback(
    (data: any) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          from: currentScreenInstance?.as,
          data,
          options: {
            push,
            replace,
            pop,
          },
        } as any
        hook?.onPoppedWithData?.(context)
      })
    },
    [lifecycleHooks]
  )

  const pop = useCallback(
    (
      depth = 1,
      options?: {
        /**
         * activate screen switch animation
         */
        animate?: boolean
      }
    ) => {
      beforePop()
      setDepth(depth)

      const backwardCount = screenInstances
        .filter(
          (_, idx) =>
            idx > screenInstancePtr - depth && idx <= screenInstancePtr
        )
        .map((screenInstance) => screenInstance.nestedRouteCount)
        .reduce((acc, current) => acc + current + 1, 0)

      /**
       * Send data to `await push()`
       */
      function send<T = object>(
        /**
         * Payload
         */
        data: T
      ) {
        setData(data)
        // FIXME: 'onPoppedWithData' and 'onPopped' should be unified later
        onPoppedWithData(data)
      }
      onPopped()
      nextTick(() => {
        const animate = options?.animate ?? true
        activeAnimation(animate)
        navigate(-backwardCount)
      })

      return {
        send,
      }
    },
    [screenInstances, screenInstancePtr, screenInstancePromiseMap]
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

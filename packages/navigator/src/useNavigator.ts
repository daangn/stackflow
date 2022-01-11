import {useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { useScreenInstance } from './components/Stack.ContextScreenInstance'
import { useScreenInstances } from './globalState'
import {
  makeNavigatorSearchParams,
  nextTick,
  parseNavigatorSearchParams,
} from './helpers'
import { useIncrementalId } from './hooks'

enum PluginTarget {
    screenInstance
}

type BeforePushType = {to: string, options: { createSomething: () => any}};

export interface PluginType {
    target: PluginTarget;
    handlers: {[funName: string]: () => void;};
    lifeCycleHooks: {
        beforePush?: (context: BeforePushType) => Promise<BeforePushType | void>;
        onPushed?: (to: string) => void;
        beforePop?: (from: string) => void;
        onPopped?: (from: string, data: any, options: any) => void;
        onPoppedWithData?: (from: string, data: any, options: any) => void;
    }
}
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
    screenPlugins
  } = useScreenInstances()

  const navigatorSearchParams = parseNavigatorSearchParams(location.search)
  const { present, screenInstanceId } = navigatorSearchParams.toObject()

  const currentScreenInstance = useMemo(() => screenInstances[screenInstancePtr], [screenInstances, screenInstancePtr]);

  const beforePush = useCallback((to: string) => {
      screenPlugins.forEach(async plugin => {
          await plugin?.lifeCycleHooks?.beforePush?.({to, options: { createSomething: () => {} }});
      })
  }, [screenPlugins])

  const onPushed = useCallback((to) => {
      screenPlugins.forEach(plugin => {
              plugin?.lifeCycleHooks?.onPushed?.(to);
      })
  }, [screenPlugins])

  const push = useCallback(
    <T = object>(
      to: string,
      options?: {
        /**
         * Bottom to top animation (iOS only)
         */
        present?: boolean
      },
    ): Promise<T | null> =>
      new Promise(async (resolve) => {
        await beforePush(to);
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
        onPushed(to);
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

      nextTick(() => {
        history.replace(`${pathname}?${navigatorSearchParams.toString()}`)
      })
    },
    [history, screenInstanceId, present]
  )

    const beforePop = useCallback(() => {
        screenPlugins.forEach(plugin => {
            plugin?.lifeCycleHooks.beforePop?.(currentScreenInstance.as);
        })
    }, [])

    const onPopped = useCallback(() => {
        screenPlugins.forEach(plugin => {
            // TODO: prepare data and options, unifying onPoppedWithData
            plugin?.lifeCycleHooks.onPopped?.(currentScreenInstance.as, null, null);
        })

    }, [])

    const onPoppedWithData = useCallback((data: any) => {
        screenPlugins.forEach(plugin => {
            plugin?.lifeCycleHooks.onPoppedWithData?.(currentScreenInstance.as, data, {});
        });
    }, [])

  const pop = useCallback(
    (depth = 1) => {
        beforePop();
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

        if (targetScreenInstance && targetPromise?.resolve) {
          targetPromise.resolve(_data ?? null)
        }
      })

      /**
       * Send data to `await push()`
       */
      function send<T = object>(
        /**
         * Payload
         */
        data: T,
      ) {
        _data = data
        // FIXME: 'onPoppedWithData' and 'onPopped' should be unified later
        onPoppedWithData(data);
      }
      onPopped();
      nextTick(() => {
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
      ...screenPlugins.reduce((acc, curr) => {
            if(curr && curr.handlers) {
                acc = {
                    ...acc,
                    ...Object.keys(curr.handlers).reduce((_acc, _curr) => {
                        _acc = {
                            ..._acc,
                            [_curr]: curr.handlers[_curr]
                        }
                        return _acc;
                    }, {}),
                }
            }
            return acc;
        }, {})
    }),
    [push, replace, pop]
  )
}

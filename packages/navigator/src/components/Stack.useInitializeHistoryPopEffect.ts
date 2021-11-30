import { matchPath } from 'react-router-dom'

import { IScreenInstance, useScreenInstances, useScreens } from '../globalState'
import { parseNavigatorSearchParams } from '../helpers'
import { useHistoryPopEffect } from '../hooks'
import usePop from './Stack.usePop'
import { usePush } from './Stack.usePush'

function useInitializeHistoryPopEffect() {
  const { screens } = useScreens()

  const { screenInstances, screenInstancePtr, mapScreenInstance } =
    useScreenInstances()

  const push = usePush()
  const pop = usePop()

  useHistoryPopEffect(
    {
      backward(location) {
        const matchScreen = Object.values(screens).find(
          (screen) =>
            screen &&
            matchPath(location.pathname, { exact: true, path: screen.path })
        )

        const navigatorSearchParams = parseNavigatorSearchParams(
          location.search
        )
        const { screenInstanceId } = navigatorSearchParams.toObject()

        if (screenInstanceId && matchScreen) {
          const nextPtr = screenInstances.findIndex(
            (screenInstance) => screenInstance.id === screenInstanceId
          )

          mapScreenInstance({
            ptr: screenInstancePtr,
            mapper: (screenInstance) => ({
              ...screenInstance,
              nestedRouteCount: 0,
            }),
          })
          pop({
            depth: screenInstancePtr - nextPtr,
            targetScreenInstanceId: screenInstanceId,
          })
        } else if (screenInstances[screenInstancePtr]?.nestedRouteCount === 0) {
          pop({
            depth: 1,
          })
        } else {
          mapScreenInstance({
            ptr: screenInstancePtr,
            mapper: (screenInstance) => ({
              ...screenInstance,
              nestedRouteCount: screenInstance.nestedRouteCount - 1,
            }),
          })
        }
      },
      forward(location) {
        const navigatorSearchParams = parseNavigatorSearchParams(
          location.search
        )
        const { screenInstanceId, present } = navigatorSearchParams.toObject()

        const matchScreen = Object.values(screens).find(
          (screen) =>
            screen &&
            matchPath(location.pathname, { exact: true, path: screen.path })
        )

        if (screenInstanceId && matchScreen) {
          push({
            screenId: matchScreen.id,
            screenInstanceId,
            present,
            as: location.pathname,
          })
        } else {
          mapScreenInstance({
            ptr: screenInstancePtr,
            mapper(screenInstance: IScreenInstance): IScreenInstance {
              return {
                ...screenInstance,
                nestedRouteCount: screenInstance.nestedRouteCount + 1,
              }
            },
          })
        }
      },
    },
    [screens, screenInstances, screenInstancePtr, mapScreenInstance, pop, push]
  )
}

export default useInitializeHistoryPopEffect

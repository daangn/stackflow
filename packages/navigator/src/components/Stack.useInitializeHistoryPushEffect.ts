import { matchPath } from 'react-router-dom'

import { useScreenInstances, useScreens } from '../globalState'
import { parseNavigatorSearchParams } from '../helpers'
import { useHistoryPushEffect } from '../hooks'
import { usePush } from './Stack.usePush'

export function useInitializeHistoryPushEffect() {
  const { screens } = useScreens()
  const { screenInstancePtr, mapScreenInstance } = useScreenInstances()

  const push = usePush()

  useHistoryPushEffect(
    (location) => {
      const navigatorSearchParams = parseNavigatorSearchParams(location.search)
      const { screenInstanceId, present } = navigatorSearchParams.toObject()

      const matchScreen = Object.values(screens).find(
        (screen) =>
          !!screen &&
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
          mapper: (screenInstance) => ({
            ...screenInstance,
            nestedRouteCount: screenInstance.nestedRouteCount + 1,
          }),
        })
      }
    },
    [screens, screenInstancePtr, mapScreenInstance]
  )
}

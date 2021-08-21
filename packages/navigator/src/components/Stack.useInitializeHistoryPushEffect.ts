import { matchPath } from 'react-router-dom'

import { getNavigatorParams } from '../helpers'
import { useHistoryPushEffect } from '../hooks'
import { useStore, useStoreActions } from '../store'
import { usePush } from './Stack.usePush'

export function useInitializeHistoryPushEffect() {
  const store = useStore()
  const { mapScreenInstance } = useStoreActions()

  const push = usePush()

  useHistoryPushEffect(
    (location) => {
      const { screens, screenInstancePtr } = store.getState()

      const searchParams = new URLSearchParams(location.search)
      const { screenInstanceId, present } = getNavigatorParams(searchParams)

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
    [push]
  )
}

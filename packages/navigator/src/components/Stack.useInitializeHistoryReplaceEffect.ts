import { matchPath } from 'react-router-dom'

import { getNavigatorParams } from '../helpers'
import { useHistoryReplaceEffect } from '../hooks'
import { useStore } from '../store'
import { useReplace } from './Stack.useReplace'

export function useInitializeHistoryReplaceEffect() {
  const store = useStore()

  const replace = useReplace()

  useHistoryReplaceEffect(
    (location) => {
      const { screens } = store.getState()

      const searchParams = new URLSearchParams(location.search)
      const { screenInstanceId, present } = getNavigatorParams(searchParams)

      const matchScreen = Object.values(screens).find(
        (screen) =>
          screen &&
          matchPath(location.pathname, { exact: true, path: screen.path })
      )

      if (screenInstanceId && matchScreen) {
        replace({
          screenId: matchScreen.id,
          screenInstanceId,
          present,
          as: location.pathname,
        })
      }
    },
    [replace]
  )
}

import { matchPath } from 'react-router-dom'

import { useScreens } from '../globalState'
import { parseNavigatorSearchParams } from '../helpers'
import { useHistoryReplaceEffect } from '../hooks'
import { useReplace } from './Stack.useReplace'

export function useInitializeHistoryReplaceEffect() {
  const { screens } = useScreens()

  const replace = useReplace()

  useHistoryReplaceEffect(
    (location) => {
      const navigatorSearchParams = parseNavigatorSearchParams(location.search)
      const { screenInstanceId, present } = navigatorSearchParams.toObject()

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
    [screens, replace]
  )
}

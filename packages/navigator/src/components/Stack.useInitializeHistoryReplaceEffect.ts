import { matchPath } from 'react-router-dom'

import type { IScreen } from '../globalState'
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
        (screen: IScreen | undefined) =>
          screen && matchPath(screen.path, location.pathname)
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

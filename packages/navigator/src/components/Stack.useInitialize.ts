import { useEffect } from 'react'
import { matchPath, useHistory, useLocation } from 'react-router-dom'

import { useScreenInstances, useScreens } from '../globalState'
import { NavigatorParamKeys } from '../helpers'
import { useIncrementalId } from '../hooks'
import { usePush } from './Stack.usePush'

function useInitialize() {
  const makeId = useIncrementalId()
  const location = useLocation()
  const history = useHistory()

  const { screens } = useScreens()
  const { screenInstances } = useScreenInstances()

  const push = usePush()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (window.__KARROTFRAME__) {
      return console.error('Only one Navigator is allowed in an app')
    }

    window.__KARROTFRAME__ = true

    const searchParams = new URLSearchParams(location.search)
    const screenInstanceId = makeId()
    searchParams.set(NavigatorParamKeys.SCREEN_INSTANCE_ID, screenInstanceId)

    if (screenInstances.length === 0) {
      const matchScreen = Object.values(screens).find(
        (screen) =>
          screen &&
          matchPath(location.pathname, { exact: true, path: screen.path })
      )

      if (matchScreen) {
        push({
          screenId: matchScreen.id,
          screenInstanceId,
          present: false,
          as: location.pathname,
        })
      }

      history.replace(`${location.pathname}?${searchParams.toString()}`)
    }

    return () => {
      window.__KARROTFRAME__ = false
    }
  }, [screens, screenInstances])
}

export default useInitialize

import { useEffect } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'

import type { IScreen } from '../globalState'
import { useScreenInstances, useScreens } from '../globalState'
import { makeNavigatorSearchParams } from '../helpers'
import { useIncrementalId } from '../hooks'
import { usePush } from './Stack.usePush'

function useInitialize() {
  const makeId = useIncrementalId()
  const location = useLocation()
  const navigate = useNavigate()

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

    const screenInstanceId = makeId()
    const navigatorSearchParams = makeNavigatorSearchParams(location.search, {
      screenInstanceId,
    })

    if (screenInstances.length === 0) {
      const matchScreen = Object.values(screens).find(
        (screen: IScreen | undefined) =>
          screen && matchPath(screen.path, location.pathname)
      )

      if (matchScreen) {
        push({
          screenId: matchScreen.id,
          screenInstanceId,
          present: false,
          as: location.pathname,
        })
      }

      navigate(`${location.pathname}?${navigatorSearchParams.toString()}`, {
        replace: true,
      })
    }

    return () => {
      window.__KARROTFRAME__ = false
    }
  }, [screens, screenInstances])
}

export default useInitialize

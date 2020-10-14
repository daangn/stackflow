import { useCallback } from 'react'
import { useRecoilState } from 'recoil'

import { AtomScreenInstances, ScreenInstance } from '../atoms'

export function useScreenInstances() {
  const [screenInstances, setScreenInstances] = useRecoilState(AtomScreenInstances)

  const setScreenInstanceIn = useCallback(
    (pointer: number, setter: (screenInstance: ScreenInstance) => ScreenInstance) => {
      setScreenInstances((screenInstances) =>
        screenInstances.map((screenInstance, screenInstanceIndex) => {
          if (screenInstanceIndex === pointer) {
            return setter(screenInstance)
          } else {
            return screenInstance
          }
        })
      )
    },
    [setScreenInstances]
  )

  const pushScreenInstanceAfter = useCallback(
    (pointer: number, { screenId, screenInstanceId }: { screenId: string; screenInstanceId: string }) => {
      setScreenInstances((instances) => [
        ...instances.filter((_, index) => index <= pointer),
        {
          id: screenInstanceId,
          screenId,
          nestedRouteCount: 0,
        },
      ])
    },
    [setScreenInstances]
  )

  return {
    screenInstances,
    setScreenInstances,
    setScreenInstanceIn,
    pushScreenInstanceAfter,
  }
}

import { matchPath } from 'react-router-dom'

import { useScreens } from '../globalState'
import { getNavigatorParams } from '../helpers'
import { useHistoryPopEffect } from '../hooks'
import { IScreenInstance, useStore, useStoreActions } from '../store'
import usePop from './Stack.usePop'
import { usePush } from './Stack.usePush'

function useInitializeHistoryPopEffect() {
  const { screens } = useScreens()

  const store = useStore()
  const { mapScreenInstance } = useStoreActions()

  const push = usePush()
  const pop = usePop()

  useHistoryPopEffect(
    {
      backward(location) {
        const { screenInstances, screenInstancePtr } = store.getState()

        const matchScreen = Object.values(screens).find(
          (screen) =>
            screen &&
            matchPath(location.pathname, { exact: true, path: screen.path })
        )

        const searchParams = new URLSearchParams(location.search)
        const { screenInstanceId } = getNavigatorParams(searchParams)

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
        const { screenInstancePtr } = store.getState()
        const searchParams = new URLSearchParams(location.search)
        const { screenInstanceId, present } = getNavigatorParams(searchParams)

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
    [screens, pop, push]
  )
}

export default useInitializeHistoryPopEffect

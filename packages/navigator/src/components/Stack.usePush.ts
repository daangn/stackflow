import { useCallback } from 'react'

import { useStore, useStoreActions } from '../store'

export function usePush() {
  const store = useStore()
  const {
    insertScreenInstance,
    increaseScreenInstancePtr,
    setScreenInstancePtr,
  } = useStoreActions()

  const push = useCallback(
    ({
      screenId,
      screenInstanceId,
      present,
      as,
    }: {
      screenId: string
      screenInstanceId: string
      present: boolean
      as: string
    }) => {
      const { screenInstances, screenInstancePtr } = store.getState()

      const nextPtr = screenInstances.findIndex(
        (screenInstance) => screenInstance.id === screenInstanceId
      )

      if (nextPtr === -1) {
        insertScreenInstance({
          ptr: screenInstancePtr,
          screenInstance: {
            id: screenInstanceId,
            screenId,
            present,
            as,
          },
        })
        increaseScreenInstancePtr()
      } else {
        setScreenInstancePtr({ ptr: nextPtr })
      }
    },
    []
  )

  return push
}

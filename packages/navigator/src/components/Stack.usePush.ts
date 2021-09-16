import { useCallback } from 'react'

import { useScreenInstances } from '../globalState'

export function usePush() {
  const {
    screenInstances,
    screenInstancePtr,
    insertScreenInstance,
    incScreenInstancePtr,
    setScreenInstancePtr,
  } = useScreenInstances()

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
        incScreenInstancePtr()
      } else {
        setScreenInstancePtr(nextPtr)
      }
    },
    [
      screenInstances,
      screenInstancePtr,
      insertScreenInstance,
      incScreenInstancePtr,
      setScreenInstancePtr,
    ]
  )

  return push
}

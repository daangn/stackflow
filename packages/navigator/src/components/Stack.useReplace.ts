import { useCallback } from 'react'

import { useScreenInstances } from '../globalState'

export function useReplace() {
  const { screenInstancePtr, insertScreenInstance } = useScreenInstances()

  const replace = useCallback(
    ({
      screenId,
      screenInstanceId,
      as,
      present,
    }: {
      screenId: string
      screenInstanceId: string
      as: string
      present: boolean
    }) => {
      insertScreenInstance({
        ptr: screenInstancePtr - 1,
        screenInstance: {
          id: screenInstanceId,
          screenId,
          present,
          as,
        },
      })
    },
    [screenInstancePtr, insertScreenInstance]
  )

  return replace
}

import { useCallback } from 'react'

import { useStore, useStoreActions } from '../store'

export function useReplace() {
  const store = useStore()
  const { insertScreenInstance } = useStoreActions()

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
      const { screenInstancePtr } = store.getState()

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
    []
  )

  return replace
}

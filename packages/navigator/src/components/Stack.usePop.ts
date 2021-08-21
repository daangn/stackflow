import { useCallback } from 'react'

import { useStore, useStoreActions } from '../store'

function usePop() {
  const store = useStore()
  const { setScreenInstancePtr } = useStoreActions()

  const pop = useCallback(
    ({
      depth,
      targetScreenInstanceId,
    }: {
      depth: number
      targetScreenInstanceId?: string
    }) => {
      const { screenInstancePromises, screenInstancePtr } = store.getState()
      if (targetScreenInstanceId) {
        const promise = screenInstancePromises[targetScreenInstanceId]

        if (promise && !promise.popped) {
          promise.resolve(null)
        }
      }
      setScreenInstancePtr({
        ptr: screenInstancePtr - depth,
      })
    },
    []
  )

  return pop
}

export default usePop

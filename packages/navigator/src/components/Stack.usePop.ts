import { useCallback } from 'react'

import { useScreenInstances } from '../globalState'
import { nextTick } from '../helpers'

function usePop() {
  const { screenInstancePtr, screenInstancePromiseMap, setScreenInstancePtr } =
    useScreenInstances()

  const pop = useCallback(
    ({
      depth,
      targetScreenInstanceId,
    }: {
      depth: number
      targetScreenInstanceId?: string
    }) => {
      if (targetScreenInstanceId) {
        const promise = screenInstancePromiseMap[targetScreenInstanceId]

        if (promise) {
          nextTick(() => promise.resolve(null))
        }
      }
      setScreenInstancePtr(screenInstancePtr - depth)
    },
    [screenInstancePtr, screenInstancePromiseMap, setScreenInstancePtr]
  )

  return pop
}

export default usePop

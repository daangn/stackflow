import { useCallback } from 'react'

import { useScreenInstances } from '../globalState'

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
          setTimeout(() => promise.resolve(null), 0)
        }
      }
      setScreenInstancePtr(screenInstancePtr - depth)
    },
    [screenInstancePtr, screenInstancePromiseMap, setScreenInstancePtr]
  )

  return pop
}

export default usePop

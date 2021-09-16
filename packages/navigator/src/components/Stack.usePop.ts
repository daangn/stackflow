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
          Promise.resolve().then(() => promise.resolve(null))
        }
      }
      setScreenInstancePtr(screenInstancePtr - depth)
    },
    [screenInstancePtr, screenInstancePromiseMap, setScreenInstancePtr]
  )

  return pop
}

export default usePop

import { useEffect } from 'react'

import { useStore } from '../store'

function useDepthChangeEffect(onDepthChange?: (depth: number) => void) {
  const store = useStore()

  useEffect(() => {
    return store.listen((prevState, nextState) => {
      if (
        nextState.screenInstancePtr > -1 &&
        prevState.screenInstancePtr !== nextState.screenInstancePtr
      ) {
        onDepthChange?.(nextState.screenInstancePtr)
      }
    })
  }, [onDepthChange])
}

export default useDepthChangeEffect

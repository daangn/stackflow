import { useEffect } from 'react'

import { useScreenInstances } from '../globalState'

function useDepthChangeEffect(onDepthChange?: (depth: number) => void) {
  const { screenInstancePtr } = useScreenInstances()

  useEffect(() => {
    if (screenInstancePtr > -1) {
      onDepthChange?.(screenInstancePtr)
    }
  }, [onDepthChange, screenInstancePtr])
}

export default useDepthChangeEffect

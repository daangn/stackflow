import { useCallback } from 'react'
import { useRecoilState } from 'recoil'

import { AtomScreenInstancePointer } from '../atoms'

export function useScreenInstancePointer() {
  const [screenInstancePointer, setScreenInstancePointer] = useRecoilState(AtomScreenInstancePointer)

  const increaseScreenInstancePointer = useCallback(() => {
    setScreenInstancePointer((pointer) => pointer + 1)
  }, [setScreenInstancePointer])

  return {
    screenInstancePointer,
    setScreenInstancePointer,
    increaseScreenInstancePointer,
  }
}

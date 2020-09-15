import React, { useEffect, useMemo } from 'react'
import { useSetRecoilState } from 'recoil'
import { AtomScreens } from './atoms/Screens'
import short from 'short-uuid'
import { ScreenContext } from './contexts/ScreenContext'

interface ScreenProps {
  /**
   * 해당 스크린의 URL Path
   */
  path: string

  children: React.ReactNode
}
const Screen: React.FC<ScreenProps> = (props) => {
  const id = useMemo(() => short.generate(), [])
  const setScreens = useSetRecoilState(AtomScreens)

  useEffect(() => {
    setScreens((screens) => ({
      ...screens,
      [id]: {
        id,
        path: props.path,
        Component: ({ stackItemId: stackId }) => (
          <ScreenContext.Provider value={{ id, stackId }}>
            {props.children}
          </ScreenContext.Provider>),
      }
    }))
  }, [])

  return null
}

export default Screen

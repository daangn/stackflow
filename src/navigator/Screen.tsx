import React, { useEffect, useMemo } from 'react'
import { useSetRecoilState } from 'recoil'
import { AtomScreens } from './atoms/Screens'
import short from 'short-uuid'
import { ScreenOptionsProvider } from './contexts/ContextScreenOptions'
import { AtomScreenInstances, NavbarOptions } from './atoms/ScreenInstances'

interface ScreenProps {
  children: React.ReactNode

  /**
   * 해당 스크린의 URL Path
   */
  path: string
}
const Screen: React.FC<ScreenProps> = (props) => {
  const id = useMemo(() => short.generate(), [])

  const setScreens = useSetRecoilState(AtomScreens)
  const setScreenInstances = useSetRecoilState(AtomScreenInstances)

  useEffect(() => {
    setScreens((screens) => ({
      ...screens,
      [id]: {
        id,
        path: props.path,
        Component: ({ screenInstanceId }) => {
          /**
           * ScreenContext를 통해 유저가 navbar를 바꿀때마다
           * 실제 ScreenInstance의 navbar를 변경
           */
          const setNavbar = (navbar: NavbarOptions) => {
            setScreenInstances((instances) => {
              return instances.map((instance) => {
                if (instance.id === screenInstanceId) {
                  return {
                    ...instance,
                    navbar,
                  }
                } else {
                  return instance
                }
              })
            })
          }

          return (
            <ScreenOptionsProvider
              value={{
                setNavbar,
                screenInstanceId,
              }}
            >
              {props.children}
            </ScreenOptionsProvider>
          )
        },
      }
    }))
  }, [])

  return null
}

export default Screen

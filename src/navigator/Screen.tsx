import React, { useEffect, useMemo } from 'react'
import { useSetRecoilState } from 'recoil'
import short from 'short-uuid'
import { ScreenOptionsProvider, ScreenInfoProvider } from './contexts'
import { AtomScreens, AtomScreenInstanceOptions, NavbarOptions } from './atoms'

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
  const setScreenInstanceOptions = useSetRecoilState(AtomScreenInstanceOptions)

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

            setScreenInstanceOptions((options) => ({
              ...options,
              [screenInstanceId]: {
                ...options[screenInstanceId],
                navbar,
              }
            }))
          }

          return (
            <ScreenInfoProvider
              value={{
                screenInstanceId,
              }}
            >
              <ScreenOptionsProvider
                value={{
                  setNavbar,
                }}
              >
                {props.children}
              </ScreenOptionsProvider>
            </ScreenInfoProvider>
          )
        },
      }
    }))
  }, [])

  return null
}

export default Screen

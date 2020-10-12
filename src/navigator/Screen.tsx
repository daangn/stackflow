import React, { useEffect, useMemo } from 'react'
import { useSetRecoilState } from 'recoil'

import { generateScreenId } from '../utils'
import { AtomScreens, AtomScreenInstanceOptions, NavbarOptions } from './atoms'
import { ScreenInstanceOptionsProvider, ScreenInstanceInfoProvider } from './contexts'

interface ScreenProps {
  /**
   * 해당 스크린의 URL Path
   */
  path: string

  /**
   * 해당 스크린에 표시할 컴포넌트
   */
  component?: React.ComponentType
}
const Screen: React.FC<ScreenProps> = (props) => {
  const Component = props.component

  const id = useMemo(() => generateScreenId(), [])

  const setScreens = useSetRecoilState(AtomScreens)
  const setScreenInstanceOptions = useSetRecoilState(AtomScreenInstanceOptions)

  useEffect(() => {
    if (!props.children && !props.component) {
      console.warn('component props, children 중 하나는 반드시 필요합니다')
      return
    }

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
              },
            }))
          }

          return (
            <ScreenInstanceInfoProvider
              value={{
                screenInstanceId,
                path: props.path,
              }}>
              <ScreenInstanceOptionsProvider
                value={{
                  setNavbar,
                }}>
                {Component ? <Component /> : props.children}
              </ScreenInstanceOptionsProvider>
            </ScreenInstanceInfoProvider>
          )
        },
      },
    }))
  }, [props])

  return null
}

export default Screen

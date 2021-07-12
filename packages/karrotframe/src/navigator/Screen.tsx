import React, { useEffect } from 'react'

import {
  ScreenInstanceInfoProvider,
  ScreenInstanceOptionsProvider,
} from './contexts'
import { ScreenComponentProps } from './ScreenComponentProps'
import {
  NavbarOptions,
  removeScreen,
  addScreen,
  addScreenInstanceOption,
} from './store'

interface Props {
  /**
   * 해당 스크린의 URL Path
   */
  path: string

  /**
   * 해당 스크린에 표시할 컴포넌트
   */
  component?: React.ComponentType<ScreenComponentProps>
}
const Screen: React.FC<Props> = (props) => {
  const { component: Component } = props

  useEffect(() => {
    if (!props.children && !Component) {
      console.warn('component props, children 중 하나는 반드시 필요합니다')
      return
    }

    const screenId = props.path

    addScreen({
      screen: {
        id: screenId,
        path: props.path,
        Component({ screenInstanceId, isTop, isRoot, as }) {
          const setNavbar = (navbar: NavbarOptions) => {
            addScreenInstanceOption({
              screenInstanceId,
              screenInstanceOption: {
                navbar,
              },
            })
          }

          return (
            <ScreenInstanceInfoProvider
              value={{
                screenInstanceId,
                as,
                path: props.path,
              }}
            >
              <ScreenInstanceOptionsProvider
                value={{
                  setNavbar,
                }}
              >
                {Component ? (
                  <Component isTop={isTop} isRoot={isRoot} />
                ) : (
                  props.children
                )}
              </ScreenInstanceOptionsProvider>
            </ScreenInstanceInfoProvider>
          )
        },
      },
    })

    return () => {
      removeScreen({
        screenId,
      })
    }
  }, [props.path, Component])

  return null
}

export default Screen

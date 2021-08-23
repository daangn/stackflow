import React, { useEffect } from 'react'

import {
  ScreenInstanceInfoProvider,
  ScreenInstanceOptionsProvider,
} from './contexts'
import { INavbarOptions, useStoreActions } from './store'
import { IScreenComponentProps } from './types'

interface IScreenProps {
  /**
   * URL path
   */
  path: string

  /**
   * Component
   */
  component?: React.ComponentType<IScreenComponentProps>
}
const Screen: React.FC<IScreenProps> = (props) => {
  const { component: Component } = props
  const { addScreen, addScreenInstanceOption, removeScreen } = useStoreActions()

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
          const setNavbar = (navbar: INavbarOptions) => {
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

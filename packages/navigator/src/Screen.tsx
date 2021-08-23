import React, { useCallback, useEffect, useMemo } from 'react'

import {
  ScreenInstanceInfoProvider,
  ScreenInstanceSetNavbarProvider,
} from './contexts'
import { INavbarOptions, useStoreActions } from './store'

interface IScreenProps {
  /**
   * URL path
   */
  path: string

  /**
   * Component
   */
  component?: React.ComponentType
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
        Component({ screenInstanceId, as, isTop, isRoot }) {
          const setNavbar = useCallback(
            (navbar: INavbarOptions) => {
              addScreenInstanceOption({
                screenInstanceId,
                screenInstanceOption: {
                  navbar,
                },
              })
            },
            [addScreenInstanceOption, screenInstanceId]
          )

          const screenInstanceInfo = useMemo(
            () => ({
              screenInstanceId,
              as,
              isTop,
              isRoot,
              path: props.path,
            }),
            [screenInstanceId, as, isTop, isRoot, props.path]
          )

          return (
            <ScreenInstanceInfoProvider value={screenInstanceInfo}>
              <ScreenInstanceSetNavbarProvider value={setNavbar}>
                {Component ? <Component /> : props.children}
              </ScreenInstanceSetNavbarProvider>
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

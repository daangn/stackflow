import React, { useCallback, useEffect, useMemo } from 'react'

import {
  ScreenInstanceProvider,
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
  const { registerScreen, addScreenInstanceOption } = useStoreActions()

  useEffect(() => {
    if (!props.children && !Component) {
      console.warn('Either component props or children is required')
      return
    }

    const screenId = props.path

    const unregisterScreen = registerScreen({
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

          const screenInstanceContext = useMemo(
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
            <ScreenInstanceProvider value={screenInstanceContext}>
              <ScreenInstanceSetNavbarProvider value={setNavbar}>
                {Component ? <Component /> : props.children}
              </ScreenInstanceSetNavbarProvider>
            </ScreenInstanceProvider>
          )
        },
      },
    })

    return () => {
      unregisterScreen()
    }
  }, [props.path, Component])

  return null
}

export default Screen

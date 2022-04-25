import React, { useEffect } from 'react'

import { useScreens } from './globalState'

interface IScreenProps {
  /**
   * URL path
   */
  path: string

  /**
   * Component
   */
  component?: React.ComponentType

  /**
   * children components
   */
  children?: React.ReactNode
}
const Screen: React.FC<IScreenProps> = (props) => {
  const { path } = props
  const { registerScreen } = useScreens()

  useEffect(() => {
    if (!props.children && !props.component) {
      console.warn('Either component props or children is required')
      return
    }

    const unregisterScreen = registerScreen({
      id: path,
      path,
      Component() {
        if (props.component) {
          return <props.component />
        } else {
          return <>{props.children}</>
        }
      },
    })

    return () => {
      unregisterScreen()
    }
  }, [props.path, props.component])

  return null
}

export default Screen

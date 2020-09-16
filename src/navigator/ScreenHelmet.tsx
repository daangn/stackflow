import React, { useEffect } from 'react'

import { useScreenOptions } from './contexts'

interface ScreenHelmetProps {
  title?: string
  left?: React.ReactNode
  right?: React.ReactNode
  center?: React.ReactNode
}
const ScreenHelmet: React.FC<ScreenHelmetProps> = (props) => {
  const screen = useScreenOptions()

  useEffect(() => {
    screen.setNavbar({
      visible: true,
      title: props.title ?? '',
      left: props.left ?? null,
      right: props.right ?? null,
      center: props.center ?? null,
    })
  }, [props])

  return null
}

export default ScreenHelmet

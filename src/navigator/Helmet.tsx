import React, { useEffect } from 'react'
import { useScreenOptions } from './contexts'

interface HelmetProps {
  title?: string
  left?: React.ReactNode
  right?: React.ReactNode
  center?: React.ReactNode
}
const Helmet: React.FC<HelmetProps> = (props) => {
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

export default Helmet

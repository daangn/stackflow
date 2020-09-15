import React, { useEffect } from 'react'
import { useScreenContext } from './contexts/ScreenContext'

interface HelmetProps {
  title: string
}
const Helmet: React.FC<HelmetProps> = (props) => {
  const screen = useScreenContext()

  useEffect(() => {
    screen.setNavbar({
      title: props.title,
      visible: true,
    })
  }, [props])

  return null
}

export default Helmet

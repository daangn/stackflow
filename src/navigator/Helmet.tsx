import React, { useEffect } from 'react'
import { useScreenOptions } from './contexts/ContextScreenOptions'

interface HelmetProps {
  title: string
}
const Helmet: React.FC<HelmetProps> = (props) => {
  const screen = useScreenOptions()

  useEffect(() => {
    screen.setNavbar({
      title: props.title,
      visible: true,
    })
  }, [props])

  return null
}

export default Helmet

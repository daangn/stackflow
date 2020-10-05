import React, { useEffect } from 'react'

import { useScreenInstanceOptions } from './contexts'

interface FixedProps {
  /**
   * 상단에 붙입니다
   */
  top?: boolean

  /**
   * 하단에 붙입니다
   */
  bottom?: boolean

  /**
   * 감싸고 있는 Div의 스타일
   */
  style?: React.CSSProperties

  children: React.ReactNode
}
const Fixed: React.FC<FixedProps> = (props) => {
  const screen = useScreenInstanceOptions()
  useEffect(() => {
    console.log('dma')
  }, [])

  useEffect(() => {
    if (props.top) {
      screen.setFixed({
        top: { node: props.children, style: props.style ?? {} },
      })
    } else if (props.bottom) {
      screen.setFixed({
        bottom: { node: props.children, style: props.style ?? {} },
      })
    }
  }, [props])

  return null
}

export default Fixed

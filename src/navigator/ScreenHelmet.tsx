import React, { useEffect } from 'react'

import { useScreenInstanceOptions } from './contexts'

interface ScreenHelmetProps {
  /**
   * 네비게이션의 타이틀
   */
  title?: React.ReactNode

  /**
   * 네비게이션의 왼쪽에 요소를 추가
   * (이전 버튼 오른쪽에 표시됩니다)
   */
  appendLeft?: React.ReactNode

  /**
   * 네비게이션의 오른쪽 요소를 추가
   * (닫기 버튼 왼쪽에 표시됩니다)
   */
  appendRight?: React.ReactNode

  /**
   * 이전 버튼을 사용자화합니다
   */
  customBackButton?: React.ReactNode

  /**
   * 닫기 버튼을 사용자화합니다
   */
  customCloseButton?: React.ReactNode
}
const ScreenHelmet: React.FC<ScreenHelmetProps> = (props) => {
  const screen = useScreenInstanceOptions()

  useEffect(() => {
    screen.setNavbar({
      visible: true,
      title: props.title ?? null,
      appendLeft: props.appendLeft ?? null,
      appendRight: props.appendRight ?? null,
      customBackButton: props.customBackButton ?? null,
      customCloseButton: props.customCloseButton ?? null,
    })
  }, [props])

  return null
}

export default ScreenHelmet

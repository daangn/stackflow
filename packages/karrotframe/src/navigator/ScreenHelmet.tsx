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
   * 닫기 버튼의 위치
   */
  closeButtonLocation?: 'left' | 'right'

  /**
   * 이전 버튼을 사용자화합니다
   */
  customBackButton?: React.ReactNode

  /**
   * 닫기 버튼을 사용자화합니다
   */
  customCloseButton?: React.ReactNode

  /**
   * 상단바를 클릭했을때 상단으로 스크롤되는 기능을 비활성화합니다
   */
  disableScrollToTop?: boolean

  /**
   * 상단바 아래 회색선을 제거합니다
   */
  noBorder?: boolean

  /**
   * 상단바를 클릭했을때 호출될 콜백을 설정합니다
   */
  onTopClick?: () => void
}
const ScreenHelmet: React.FC<ScreenHelmetProps> = (props) => {
  const screen = useScreenInstanceOptions()

  useEffect(() => {
    screen.setNavbar({
      visible: true,
      title: props.title ?? null,
      appendLeft: props.appendLeft ?? null,
      appendRight: props.appendRight ?? null,
      closeButtonLocation: props.closeButtonLocation ?? 'left',
      customBackButton: props.customBackButton ?? null,
      customCloseButton: props.customCloseButton ?? null,
      disableScrollToTop: props.disableScrollToTop ?? false,
      noBorder: props.noBorder ?? false,
      onTopClick: props.onTopClick,
    })
  }, [
    props.title,
    props.appendLeft,
    props.appendRight,
    props.closeButtonLocation,
    props.customBackButton,
    props.customCloseButton,
    props.disableScrollToTop,
    props.noBorder,
    props.onTopClick,
  ])

  useEffect(() => {
    return () => {
      screen.setNavbar({
        visible: false,
        title: null,
        appendLeft: null,
        appendRight: null,
        closeButtonLocation: 'left',
        customBackButton: null,
        customCloseButton: null,
        disableScrollToTop: false,
        noBorder: false,
        onTopClick: undefined,
      })
    }
  }, [])

  return null
}

export default ScreenHelmet

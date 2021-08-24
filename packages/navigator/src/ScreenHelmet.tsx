import React, { useEffect } from 'react'

import { useScreenInstanceSetNavbar } from './contexts'

interface IScreenHelmetProps {
  /**
   * title
   */
  title?: React.ReactNode

  /**
   * Append elements in left side
   * (It'll be displayed in right side of back button)
   */
  appendLeft?: React.ReactNode

  /**
   * Append elements in right side
   * (It'll be displayed in left side of close button when `closeButtonLocation` is `right`)
   */
  appendRight?: React.ReactNode

  /**
   * Location of close button (default: `left`)
   */
  closeButtonLocation?: 'left' | 'right'

  /**
   * Replace back button
   */
  customBackButton?: React.ReactNode

  /**
   * Replace close button
   */
  customCloseButton?: React.ReactNode

  /**
   * Remove border
   */
  noBorder?: boolean

  /**
   * Disable scroll to top feature (iOS Only)
   */
  disableScrollToTop?: boolean

  /**
   * When top part clicked (iOS Only)
   */
  onTopClick?: () => void
}
const ScreenHelmet: React.FC<IScreenHelmetProps> = (props) => {
  const setNavbar = useScreenInstanceSetNavbar()

  useEffect(() => {
    setNavbar({
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
      setNavbar({
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

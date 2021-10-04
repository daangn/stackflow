import React, { useEffect } from 'react'

import {
  makeScreenHelmetDefaultProps,
  useScreenHelmet,
} from './components/Stack.ContextScreenHelmet'

export interface IScreenHelmetProps {
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
  const {
    setScreenHelmetProps,
    setScreenHelmetVisible,
    resetScreenHelmetProps,
  } = useScreenHelmet()

  useEffect(() => {
    setScreenHelmetProps({
      ...makeScreenHelmetDefaultProps(),
      ...Object.entries(props).reduce(
        (a, [k, v]) => (v === undefined || v === null ? a : ((a[k] = v), a)),
        {}
      ),
    })
    setScreenHelmetVisible(true)
  }, [props])

  useEffect(() => resetScreenHelmetProps, [resetScreenHelmetProps])

  return null
}

export default ScreenHelmet

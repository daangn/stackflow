import React, { useEffect } from 'react'

import {
  makeScreenHelmetDefaultOption,
  useScreenHelmet,
} from './components/Stack.ScreenHelmetContext'

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
  const { setScreenHelmetOption, clearScreenHelmetOption } = useScreenHelmet()

  useEffect(() => {
    setScreenHelmetOption({
      ...makeScreenHelmetDefaultOption(),
      ...Object.entries(props).reduce(
        (a, [k, v]) => (v === undefined || v === null ? a : ((a[k] = v), a)),
        {}
      ),
      visible: true,
    })
  }, [props])

  useEffect(() => clearScreenHelmetOption, [clearScreenHelmetOption])

  return null
}

export default ScreenHelmet

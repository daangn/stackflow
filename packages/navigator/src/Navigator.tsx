import React from 'react'
import { HashRouter } from 'react-router-dom'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import Stack from './components/Stack'
import { ScreenInstancesProvider, ScreensProvider } from './globalState'
import { UniqueIdProvider } from './hooks'
import * as css from './Navigator.css'
import { INavigatorTheme } from './types'

declare global {
  interface Window {
    __KARROTFRAME__?: boolean
  }
}

const DEFAULT_CUPERTINO_ANIMATION_DURATION = 350
const DEFAULT_ANDROID_ANIMATION_DURATION = 270

interface INavigatorProps {
  /**
   * Theme (default: `Android`)
   */
  theme?: INavigatorTheme

  /**
   * Transition animation duration
   */
  animationDuration?: number

  /**
   * Remove built-in `<HashRouter />`
   * and use your own custom `<Router />`
   */
  useCustomRouter?: boolean

  /**
   * Class name appended to root div element
   */
  className?: string

  /**
   * `aria-label=` property assigned to back button
   */
  backButtonAriaLabel?: string

  /**
   * `aria-label=` property assigned to close button
   */
  closeButtonAriaLabel?: string

  /**
   * When close button clicked
   */
  onClose?: () => void

  /**
   * When navigation depth changed
   */
  onDepthChange?: (depth: number) => void
}
const Navigator: React.FC<INavigatorProps> = ({
  theme = 'Android',
  animationDuration = theme === 'Android'
    ? DEFAULT_ANDROID_ANIMATION_DURATION
    : DEFAULT_CUPERTINO_ANIMATION_DURATION,
  useCustomRouter,
  className,
  backButtonAriaLabel = 'Go back',
  closeButtonAriaLabel = 'Close',
  onClose,
  onDepthChange,
  children,
}) => {
  let h = (
    <UniqueIdProvider>
      <ScreensProvider>
        <ScreenInstancesProvider>
          <div
            className={[
              css.root({ theme }),
              ...(className ? [className] : []),
            ].join(' ')}
            style={assignInlineVars({
              [css.vars.animationDuration]: animationDuration + 'ms',
            })}
          >
            <Stack
              animationDuration={animationDuration}
              theme={theme}
              onClose={onClose}
              backButtonAriaLabel={backButtonAriaLabel}
              closeButtonAriaLabel={closeButtonAriaLabel}
              onDepthChange={onDepthChange}
            >
              {children}
            </Stack>
          </div>
        </ScreenInstancesProvider>
      </ScreensProvider>
    </UniqueIdProvider>
  )

  if (!useCustomRouter) {
    h = <HashRouter>{h}</HashRouter>
  }

  return h
}

export default Navigator

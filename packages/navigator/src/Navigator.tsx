import React from 'react'
import { HashRouter } from 'react-router-dom'
import { TransitionGroup } from 'react-transition-group'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import Stack from './components/Stack'
import { UniqueIdProvider } from './hooks'
import * as css from './Navigator.css'
import { StoreProvider } from './store'
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
   * When close button clicked
   */
  onClose?: () => void

  /**
   * When navigation depth changed
   */
  onDepthChange?: (depth: number) => void
}
const Navigator: React.FC<INavigatorProps> = (props) => {
  const theme = props.theme ?? 'Android'

  const animationDuration =
    props.animationDuration ??
    (theme === 'Android'
      ? DEFAULT_ANDROID_ANIMATION_DURATION
      : DEFAULT_CUPERTINO_ANIMATION_DURATION)

  let h = (
    <UniqueIdProvider>
      <StoreProvider>
        <div
          className={[
            css.root({
              android: theme === 'Android',
              cupertino: theme === 'Cupertino',
            }),
            ...(props.className ? [props.className] : []),
          ].join(' ')}
          style={assignInlineVars({
            [css.vars.animationDuration]: animationDuration + 'ms',
          })}
        >
          <TransitionGroup component={null}>
            <Stack
              animationDuration={animationDuration}
              theme={theme}
              onClose={props.onClose}
              onDepthChange={props.onDepthChange}
            >
              {props.children}
            </Stack>
          </TransitionGroup>
        </div>
      </StoreProvider>
    </UniqueIdProvider>
  )

  if (!props.useCustomRouter) {
    h = <HashRouter>{h}</HashRouter>
  }

  return h
}

export default Navigator

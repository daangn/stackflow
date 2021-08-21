import React from 'react'
import { HashRouter } from 'react-router-dom'
import { TransitionGroup } from 'react-transition-group'

import Stack from './components/Stack'
import { NavigatorOptionsProvider } from './contexts'
import { NavigatorTheme } from './helpers'
import { UniqueIdProvider } from './hooks'
import * as css from './Navigator.css'
import { StoreProvider } from './store'

declare global {
  interface Window {
    __KARROTFRAME__?: boolean
  }
}

const DEFAULT_CUPERTINO_ANIMATION_DURATION = 350
const DEFAULT_ANDROID_ANIMATION_DURATION = 270

interface NavigatorProps {
  /**
   * Theme (default: `Android`)
   */
  theme?: NavigatorTheme

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
   * When close button clicked
   */
  onClose?: () => void

  /**
   * When navigation depth changed
   */
  onDepthChange?: (depth: number) => void
}
const Navigator: React.FC<NavigatorProps> = (props) => {
  let h = (
    <NavigatorOptionsProvider
      value={{
        theme: props.theme ?? 'Android',
        animationDuration:
          props.animationDuration ??
          (() => {
            switch (props.theme ?? 'Android') {
              case 'Cupertino':
                return DEFAULT_CUPERTINO_ANIMATION_DURATION
              case 'Android':
                return DEFAULT_ANDROID_ANIMATION_DURATION
            }
          })(),
      }}
    >
      <UniqueIdProvider>
        <StoreProvider>
          <div className={css.root}>
            <TransitionGroup component={null}>
              <Stack
                theme={props.theme ?? 'Android'}
                onClose={props.onClose}
                onDepthChange={props.onDepthChange}
              >
                {props.children}
              </Stack>
            </TransitionGroup>
          </div>
        </StoreProvider>
      </UniqueIdProvider>
    </NavigatorOptionsProvider>
  )

  if (!props.useCustomRouter) {
    h = <HashRouter>{h}</HashRouter>
  }

  return h
}

export default Navigator

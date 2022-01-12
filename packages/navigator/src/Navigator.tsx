import React, {ReactNode} from 'react'
import { HashRouter } from 'react-router-dom'
import { TransitionGroup } from 'react-transition-group'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import Stack from './components/Stack'
import { ProviderScreenInstances, ProviderScreens } from './globalState'
import { ProviderIncrementalId } from './hooks'
import * as css from './Navigator.css'
import { INavigatorTheme } from './types'
import {PluginType} from "./useNavigator";
import {ProviderPlugins} from "./plugins/Plugins";

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

  /**
   * plugins
   */
  plugins?: PluginType[]
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
  plugins= [],
  children,
}) => {

  const wrapComponent = (wrappers: any[], component: any) => {
    const all = [...wrappers, component];
    const create = (i: number): ReactNode => {
      const Component = all[i];
      if(!all[i]) return null;
      if(typeof Component ==='string') return React.createElement(all[i], null, create(i+1));
      return (<Component>{create(i+1)}</Component>)
    }
    return create(0);
  }

  let h = (
    <ProviderIncrementalId>
      {wrapComponent(plugins.map(plugin => (plugin as any)().decorators2),
          () => (<ProviderPlugins plugins={plugins}>
            <ProviderScreens>
              <ProviderScreenInstances plugins={plugins}>
                <div
                    className={[
                      css.root({ theme }),
                      ...(className ? [className] : []),
                    ].join(' ')}
                    style={assignInlineVars({
                      [css.vars.animationDuration]: animationDuration + 'ms',
                    })}
                >
                  <TransitionGroup component={null}>
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
                  </TransitionGroup>
                </div>
              </ProviderScreenInstances>
            </ProviderScreens>
          </ProviderPlugins>) )}
    </ProviderIncrementalId>
  )

  if (!useCustomRouter) {
    h = <HashRouter>{h}</HashRouter>
  }

  return h
}

export default Navigator

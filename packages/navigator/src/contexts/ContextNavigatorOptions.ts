import { createContext, useContext } from 'react'

import { NavigatorTheme } from '../helpers'

export interface NavigatorOptions {
  theme: NavigatorTheme
  animationDuration: number
}
export const ContextNavigatorOptions = createContext<NavigatorOptions>(
  null as any
)

export const NavigatorOptionsProvider = ContextNavigatorOptions.Provider

export function useNavigatorOptions() {
  return useContext(ContextNavigatorOptions)
}

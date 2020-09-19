import { createContext, useContext } from 'react'

import { NavigatorTheme } from '../../types'

export const ContextNavigatorOptions = createContext<{
  theme: NavigatorTheme
  animationDuration: number
}>(null as any)

export const NavigatorOptionsProvider = ContextNavigatorOptions.Provider

export function useNavigatorOptions() {
  return useContext(ContextNavigatorOptions)
}

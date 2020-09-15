import { createContext, useContext } from 'react'
import { Environment } from '../../types'

export const ContextNavigatorOptions = createContext<{
  environment: Environment,
  animationDuration: number,
}>(null as any)

export const NavigatorOptionsProvider = ContextNavigatorOptions.Provider

export function useNavigatorOptions() {
  return useContext(ContextNavigatorOptions)
}

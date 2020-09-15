import { createContext, useContext } from 'react'
import { Environment } from '../../types'

export const NavigatorContext = createContext<{
  environment: Environment,
  animationDuration: number,
}>(null as any)

export function useNavigatorContext() {
  return useContext(NavigatorContext)
}

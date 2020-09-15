import { createContext, useContext } from 'react'
import { NavbarOptions } from '../atoms/ScreenInstances'

export const ScreenContext = createContext<{
  screenId: string,
  screenInstanceId: string,
  setNavbar: (navbar: NavbarOptions) => void
}>(null as any)

export function useScreenContext() {
  return useContext(ScreenContext)
}

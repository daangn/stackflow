import { createContext, useContext } from 'react'
import { NavbarOptions } from '../atoms/ScreenInstances'

export const ContextScreenOptions = createContext<{
  screenInstanceId: string
  setNavbar: (navbar: NavbarOptions) => void
}>(null as any)

export const ScreenOptionsProvider = ContextScreenOptions.Provider

export function useScreenOptions() {
  return useContext(ContextScreenOptions)
}

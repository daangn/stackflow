import { createContext, useContext } from 'react'
import { NavbarOptions } from '../atoms/ScreenInstanceOptions'

export const ContextScreenOptions = createContext<{
  setNavbar: (navbar: NavbarOptions) => void
}>(null as any)

export const ScreenOptionsProvider = ContextScreenOptions.Provider

export function useScreenOptions() {
  return useContext(ContextScreenOptions)
}

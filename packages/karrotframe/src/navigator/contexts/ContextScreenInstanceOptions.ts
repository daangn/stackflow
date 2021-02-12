import { createContext, useContext } from 'react'

import { NavbarOptions } from '../store'

export const ContextScreenInstanceOptions = createContext<{
  setNavbar: (navbar: NavbarOptions) => void
}>(null as any)

export const ScreenInstanceOptionsProvider =
  ContextScreenInstanceOptions.Provider

export function useScreenInstanceOptions() {
  return useContext(ContextScreenInstanceOptions)
}

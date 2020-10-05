import { createContext, useContext } from 'react'

import { FixedOptions, NavbarOptions } from '../atoms'

export const ContextScreenInstanceOptions = createContext<{
  setNavbar: (navbar: NavbarOptions) => void
  setFixed: (fixed: Partial<FixedOptions>) => void
}>(null as any)

export const ScreenInstanceOptionsProvider = ContextScreenInstanceOptions.Provider

export function useScreenInstanceOptions() {
  return useContext(ContextScreenInstanceOptions)
}

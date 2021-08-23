import { createContext, useContext } from 'react'

import { INavbarOptions } from '../store'

export const ContextScreenInstanceOptions = createContext<{
  setNavbar: (navbar: INavbarOptions) => void
}>(null as any)

export const ScreenInstanceOptionsProvider =
  ContextScreenInstanceOptions.Provider

export function useScreenInstanceOptions() {
  return useContext(ContextScreenInstanceOptions)
}

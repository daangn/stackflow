import { createContext, useContext } from 'react'

import { INavbarOptions } from '../store'

export const ContextScreenInstanceSetNavbar = createContext<
  (navbar: INavbarOptions) => void
>(null as any)

export const ScreenInstanceSetNavbarProvider =
  ContextScreenInstanceSetNavbar.Provider

export function useScreenInstanceSetNavbar() {
  return useContext(ContextScreenInstanceSetNavbar)
}

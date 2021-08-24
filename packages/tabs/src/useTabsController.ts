import { createContext, useContext } from 'react'

export const TabsControllerContext = createContext<{
  enableSwipe(): void
  disableSwipe(): void
}>(null as any)

export function useTabsController() {
  return useContext(TabsControllerContext)
}

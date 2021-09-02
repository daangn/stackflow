import { createContext, useContext } from 'react'

export const TabsControllerContext = createContext<{
  go(tabKey: string): void
  enableSwipe(): void
  disableSwipe(): void
}>(null as any)

export function useTabsController() {
  return useContext(TabsControllerContext)
}

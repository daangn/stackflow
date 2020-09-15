import { createContext, useContext } from 'react'

export const ScreenContext = createContext<{ id: string, stackId: string }>(null as any)

export function useScreenContext() {
  return useContext(ScreenContext)
}

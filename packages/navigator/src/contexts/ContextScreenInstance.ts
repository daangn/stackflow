import { createContext, useContext } from 'react'

export const ContextScreenInstance = createContext<{
  screenInstanceId: string
  path: string
  as: string
  isTop: boolean
  isRoot: boolean
}>(null as any)

export const ScreenInstanceProvider = ContextScreenInstance.Provider

export function useScreenInstance() {
  return useContext(ContextScreenInstance)
}

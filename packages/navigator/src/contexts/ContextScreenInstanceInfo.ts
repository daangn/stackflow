import { createContext, useContext } from 'react'

export const ContextScreenInstanceInfo = createContext<{
  screenInstanceId: string
  path: string
  as: string
  isTop: boolean
  isRoot: boolean
}>(null as any)

export const ScreenInstanceInfoProvider = ContextScreenInstanceInfo.Provider

export function useScreenInstanceInfo() {
  return useContext(ContextScreenInstanceInfo)
}

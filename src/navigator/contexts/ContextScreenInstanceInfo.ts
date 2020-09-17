import { createContext, useContext } from 'react'

export const ContextScreenInstanceInfo = createContext<{
  screenInstanceId: string
  path: string
}>(null as any)

export const ScreenInstanceInfoProvider = ContextScreenInstanceInfo.Provider

export function useScreenInstanceInfo() {
  return useContext(ContextScreenInstanceInfo)
}

import React, { createContext, useContext, useMemo } from 'react'

const ContextScreenInstance = createContext<ProviderScreenInstanceProps>(
  null as any
)

interface ProviderScreenInstanceProps {
  screenInstanceId: string
  screenPath: string
  as: string
  isTop: boolean
  isRoot: boolean
}
export const ProviderScreenInstance: React.FC<ProviderScreenInstanceProps> = (
  props
) => {
  const value = useMemo(
    () => ({
      screenInstanceId: props.screenInstanceId,
      screenPath: props.screenPath,
      as: props.as,
      isTop: props.isTop,
      isRoot: props.isRoot,
    }),
    [
      props.screenInstanceId,
      props.screenPath,
      props.as,
      props.isTop,
      props.isRoot,
    ]
  )
  return (
    <ContextScreenInstance.Provider value={value}>
      {props.children}
    </ContextScreenInstance.Provider>
  )
}

export function useScreenInstance() {
  return useContext(ContextScreenInstance)
}

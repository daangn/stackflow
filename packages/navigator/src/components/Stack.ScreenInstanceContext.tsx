import React, { createContext, useContext, useMemo } from 'react'

interface IScreenInstanceContext {
  screenInstanceId: string
  screenPath: string
  as: string
  isTop: boolean
  isRoot: boolean
}

export const ScreenInstanceContext = createContext<IScreenInstanceContext>(
  null as any
)

export const ScreenInstanceProvider: React.FC<IScreenInstanceContext> = (
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
    <ScreenInstanceContext.Provider value={value}>
      {props.children}
    </ScreenInstanceContext.Provider>
  )
}

export function useScreenInstance() {
  return useContext(ScreenInstanceContext)
}

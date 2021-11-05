import React, { createContext, useContext } from 'react'

export const PullToRefreshScrollContainerRefContext = createContext<
  React.RefObject<HTMLDivElement>
>(null as any)

export function usePullToRefreshScrollContainerRef() {
  return useContext(PullToRefreshScrollContainerRefContext)
}

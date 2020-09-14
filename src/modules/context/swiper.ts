import { createContext, useContext } from 'react'

export interface SwiperContextState {
  setDisable: (isDisabled: boolean) => void
  onLastPagePop?: () => void
  disabled: boolean
}

export const SwiperContext = createContext<SwiperContextState>({} as any)

SwiperContext.displayName = 'SwiperContext'

export const useSwiper = () => useContext(SwiperContext)

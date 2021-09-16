import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import compare from 'react-fast-compare'

export interface IScreenHelmetOption {
  visible: boolean
  title: React.ReactNode | null
  appendLeft: React.ReactNode | null
  appendRight: React.ReactNode | null
  closeButtonLocation: 'left' | 'right'
  customBackButton: React.ReactNode | null
  customCloseButton: React.ReactNode | null
  disableScrollToTop: boolean
  noBorder: boolean
  onTopClick?: () => void
}

export function initialScreenHelmetOption(): IScreenHelmetOption {
  return {
    visible: false,
    title: null,
    appendLeft: null,
    appendRight: null,
    closeButtonLocation: 'left',
    customBackButton: null,
    customCloseButton: null,
    disableScrollToTop: false,
    noBorder: false,
    onTopClick: undefined,
  }
}

export const ScreenHelmetContext = createContext<{
  screenHelmetOption: IScreenHelmetOption
  setScreenHelmetOption: (option: IScreenHelmetOption) => void
  clearScreenHelmetOption: () => void
}>(null as any)

export const ScreenHelmetProvider: React.FC = (props) => {
  const [screenHelmetOption, _setScreenHelmetOption] =
    useState<IScreenHelmetOption>(initialScreenHelmetOption())

  const setScreenHelmetOption = useCallback(
    (nextOption: IScreenHelmetOption) => {
      if (!compare(screenHelmetOption, nextOption)) {
        _setScreenHelmetOption(nextOption)
      }
    },
    [screenHelmetOption, _setScreenHelmetOption]
  )

  const clearScreenHelmetOption = useCallback(() => {
    _setScreenHelmetOption(initialScreenHelmetOption())
  }, [])

  const value = useMemo(
    () => ({
      screenHelmetOption,
      setScreenHelmetOption,
      clearScreenHelmetOption,
    }),
    [screenHelmetOption, setScreenHelmetOption]
  )

  return (
    <ScreenHelmetContext.Provider value={value}>
      {props.children}
    </ScreenHelmetContext.Provider>
  )
}

export function useScreenHelmet() {
  return useContext(ScreenHelmetContext)
}

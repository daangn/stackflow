import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import compare from 'react-fast-compare'

interface IScreenHelmetOption {
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

export function makeScreenHelmetDefaultOption(): IScreenHelmetOption {
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

const ContextScreenHelmet = createContext<{
  screenHelmetOption: IScreenHelmetOption
  setScreenHelmetOption: (option: IScreenHelmetOption) => void
  clearScreenHelmetOption: () => void
}>(null as any)

export const ProviderScreenHelmet: React.FC = (props) => {
  const [screenHelmetOption, _setScreenHelmetOption] =
    useState<IScreenHelmetOption>(makeScreenHelmetDefaultOption())

  const setScreenHelmetOption = useCallback(
    (nextOption: IScreenHelmetOption) => {
      if (!compare(screenHelmetOption, nextOption)) {
        _setScreenHelmetOption(nextOption)
      }
    },
    [screenHelmetOption, _setScreenHelmetOption]
  )

  const clearScreenHelmetOption = useCallback(() => {
    _setScreenHelmetOption(makeScreenHelmetDefaultOption())
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
    <ContextScreenHelmet.Provider value={value}>
      {props.children}
    </ContextScreenHelmet.Provider>
  )
}

export function useScreenHelmet() {
  return useContext(ContextScreenHelmet)
}

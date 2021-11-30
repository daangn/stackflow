import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import { useDeepState } from '../hooks'
import { IScreenHelmetProps } from '../ScreenHelmet'

export function makeScreenHelmetDefaultProps(): IScreenHelmetProps {
  return {
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
  screenHelmetVisible: boolean
  screenHelmetProps: IScreenHelmetProps
  setScreenHelmetVisible: (value: boolean) => void
  setScreenHelmetProps: (option: IScreenHelmetProps) => void
  resetScreenHelmetProps: () => void
}>(null as any)

export const ProviderScreenHelmet: React.FC = (props) => {
  const [screenHelmetVisible, setScreenHelmetVisible] = useState(false)
  const [screenHelmetProps, setScreenHelmetProps] =
    useDeepState<IScreenHelmetProps>(makeScreenHelmetDefaultProps())

  const resetScreenHelmetProps = useCallback(() => {
    setScreenHelmetVisible(false)
    setScreenHelmetProps(makeScreenHelmetDefaultProps())
  }, [setScreenHelmetProps, setScreenHelmetVisible])

  const value = useMemo(
    () => ({
      screenHelmetVisible,
      screenHelmetProps,
      setScreenHelmetVisible,
      setScreenHelmetProps,
      resetScreenHelmetProps,
    }),
    [
      screenHelmetVisible,
      screenHelmetProps,
      setScreenHelmetVisible,
      setScreenHelmetProps,
      resetScreenHelmetProps,
    ]
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

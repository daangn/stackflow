import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { usePlugins } from './Plugins'

interface IScreen {
  id: string
  path: string
  Component: React.ComponentType
}

interface IScreenMap {
  [key: string]: IScreen | undefined
}

const ContextScreens = createContext<{
  screens: IScreenMap
  registerScreen: (screen: IScreen) => () => void
}>(null as any)

export const ProviderScreens: React.FC = (props) => {
  const [screens, setScreens] = useState<IScreenMap>({})
  const { lifecycleHooks } = usePlugins()

  const onRegisterScreen = useCallback(
    (screen: IScreen) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          screen,
          screens,
        }
        hook?.onRegisterScreen?.(context)
      })
    },
    [lifecycleHooks, screens]
  )

  const beforeRegisterScreen = useCallback(
    (screen: IScreen) => {
      lifecycleHooks.forEach((hook) => {
        const context = {
          screen,
          screens,
        }
        hook?.beforeRegisterScreen?.(context)
      })
    },
    [lifecycleHooks, screens]
  )

  const registerScreen = useCallback((screen: IScreen) => {
    beforeRegisterScreen(screen)

    setScreens((screens) => ({
      ...screens,
      [screen.id]: screen,
    }))

    onRegisterScreen(screen)

    const unregister = () => {
      setScreens((screens) => ({
        ...screens,
        [screen.id]: undefined,
      }))
    }

    return unregister
  }, [])

  const value = useMemo(
    () => ({
      screens,
      registerScreen,
    }),
    [screens, registerScreen]
  )

  return (
    <ContextScreens.Provider value={value}>
      {props.children}
    </ContextScreens.Provider>
  )
}

export function useScreens() {
  return useContext(ContextScreens)
}

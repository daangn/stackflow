import classnames from 'clsx'
import React, { useCallback, useEffect, useRef } from 'react'
import {
  HashRouter,
  matchPath,
  useHistory,
  useLocation,
} from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import { Card } from './components'
import { NavigatorOptionsProvider, useNavigatorOptions } from './contexts'
import {
  getNavigatorParams,
  NavigatorParamKeys,
  NavigatorTheme,
} from './helpers'
import {
  useHistoryPopEffect,
  useHistoryPushEffect,
  useHistoryReplaceEffect,
} from './hooks/useHistoryEffect'
import { UniqueIdProvider, useUniqueId } from './hooks/useUniqueId'
import styles from './Navigator.scss'
import {
  ScreenInstance,
  StoreProvider,
  useStore,
  useStoreActions,
  useStoreSelector,
} from './store'

declare global {
  interface Window {
    __KARROTFRAME__?: boolean
  }
}

const DEFAULT_CUPERTINO_ANIMATION_DURATION = 350
const DEFAULT_ANDROID_ANIMATION_DURATION = 270

interface NavigatorProps {
  /**
   * Theme (default: `Web`)
   */
  theme?: NavigatorTheme

  /**
   * Transition animation duration
   */
  animationDuration?: number

  /**
   * Remove built-in `<HashRouter />`
   * and use your own custom `<Router />`
   */
  useCustomRouter?: boolean

  /**
   * When close button clicked
   */
  onClose?: () => void

  /**
   * When navigation depth changed
   */
  onDepthChange?: (depth: number) => void
}
const Navigator: React.FC<NavigatorProps> = (props) => {
  let h = (
    <NavigatorOptionsProvider
      value={{
        theme: props.theme ?? 'Android',
        animationDuration:
          props.animationDuration ??
          (() => {
            switch (props.theme ?? 'Android') {
              case 'Cupertino':
                return DEFAULT_CUPERTINO_ANIMATION_DURATION
              case 'Android':
                return DEFAULT_ANDROID_ANIMATION_DURATION
            }
          })(),
      }}
    >
      <UniqueIdProvider>
        <StoreProvider>
          <NavigatorScreens
            theme={props.theme ?? 'Android'}
            onClose={props.onClose}
            onDepthChange={props.onDepthChange}
          >
            {props.children}
          </NavigatorScreens>
        </StoreProvider>
      </UniqueIdProvider>
    </NavigatorOptionsProvider>
  )

  if (!props.useCustomRouter) {
    h = <HashRouter>{h}</HashRouter>
  }

  return h
}

interface NavigatorScreensProps {
  theme: NavigatorTheme
  onClose?: () => void
  onDepthChange?: (depth: number) => void
}
const NavigatorScreens: React.FC<NavigatorScreensProps> = (props) => {
  const location = useLocation()
  const history = useHistory()
  const { uid } = useUniqueId()

  const store = useStore()
  const { screenInstances, screenInstancePtr } = useStoreSelector((state) => ({
    screenInstances: state.screenInstances,
    screenInstancePtr: state.screenInstancePtr,
  }))
  const {
    increaseScreenInstancePtr,
    insertScreenInstance,
    mapScreenInstance,
    setScreenInstancePtr,
  } = useStoreActions()

  const pushScreen = useCallback(
    ({
      screenId,
      screenInstanceId,
      present,
      as,
    }: {
      screenId: string
      screenInstanceId: string
      present: boolean
      as: string
    }) => {
      const { screenInstances, screenInstancePtr } = store.getState()

      const nextPtr = screenInstances.findIndex(
        (screenInstance) => screenInstance.id === screenInstanceId
      )

      if (nextPtr === -1) {
        insertScreenInstance({
          ptr: screenInstancePtr,
          screenInstance: {
            id: screenInstanceId,
            screenId,
            present,
            as,
          },
        })
        increaseScreenInstancePtr()
      } else {
        setScreenInstancePtr({ ptr: nextPtr })
      }
    },
    []
  )

  const replaceScreen = useCallback(
    ({
      screenId,
      screenInstanceId,
      as,
      present,
    }: {
      screenId: string
      screenInstanceId: string
      as: string
      present: boolean
    }) => {
      const { screenInstancePtr } = store.getState()

      insertScreenInstance({
        ptr: screenInstancePtr - 1,
        screenInstance: {
          id: screenInstanceId,
          screenId,
          present,
          as,
        },
      })
    },
    []
  )

  const popScreen = useCallback(
    ({
      depth,
      targetScreenInstanceId,
    }: {
      depth: number
      targetScreenInstanceId?: string
    }) => {
      const { screenInstancePromises, screenInstancePtr } = store.getState()
      if (targetScreenInstanceId) {
        const promise = screenInstancePromises[targetScreenInstanceId]

        if (promise && !promise.popped) {
          promise.resolve(null)
        }
      }
      setScreenInstancePtr({
        ptr: screenInstancePtr - depth,
      })
    },
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (window.__KARROTFRAME__) {
      throw new Error('한 개의 앱에는 한 개의 Navigator만 허용됩니다')
    }

    window.__KARROTFRAME__ = true

    const searchParams = new URLSearchParams(location.search)
    searchParams.set(NavigatorParamKeys.screenInstanceId, uid())

    history.replace(`${location.pathname}?${searchParams.toString()}`)

    return () => {
      window.__KARROTFRAME__ = false
    }
  }, [])

  useEffect(() => {
    if (!location.search) {
      return
    }

    const { screens, screenInstances } = store.getState()

    if (screenInstances.length > 0) {
      return
    }

    const searchParams = new URLSearchParams(location.search)
    const { screenInstanceId } = getNavigatorParams(searchParams)

    const matchScreen = Object.values(screens).find(
      (screen) =>
        screen &&
        matchPath(location.pathname, { exact: true, path: screen.path })
    )

    if (screenInstanceId && matchScreen) {
      pushScreen({
        screenId: matchScreen.id,
        screenInstanceId,
        present: false,
        as: location.pathname,
      })
    }
  }, [location.search])

  useEffect(() => {
    return store.listen((prevState, nextState) => {
      if (
        nextState.screenInstancePtr > -1 &&
        prevState.screenInstancePtr !== nextState.screenInstancePtr
      ) {
        props.onDepthChange?.(nextState.screenInstancePtr)
      }
    })
  }, [props.onDepthChange])

  useHistoryPushEffect(
    (location) => {
      const { screens, screenInstancePtr } = store.getState()

      const searchParams = new URLSearchParams(location.search)
      const { screenInstanceId, present } = getNavigatorParams(searchParams)

      const matchScreen = Object.values(screens).find(
        (screen) =>
          !!screen &&
          matchPath(location.pathname, { exact: true, path: screen.path })
      )

      if (screenInstanceId && matchScreen) {
        pushScreen({
          screenId: matchScreen.id,
          screenInstanceId,
          present,
          as: location.pathname,
        })
      } else {
        mapScreenInstance({
          ptr: screenInstancePtr,
          mapper: (screenInstance) => ({
            ...screenInstance,
            nestedRouteCount: screenInstance.nestedRouteCount + 1,
          }),
        })
      }
    },
    [pushScreen]
  )

  useHistoryReplaceEffect(
    (location) => {
      const { screens } = store.getState()

      const searchParams = new URLSearchParams(location.search)
      const { screenInstanceId, present } = getNavigatorParams(searchParams)

      const matchScreen = Object.values(screens).find(
        (screen) =>
          screen &&
          matchPath(location.pathname, { exact: true, path: screen.path })
      )

      if (screenInstanceId && matchScreen) {
        replaceScreen({
          screenId: matchScreen.id,
          screenInstanceId,
          present,
          as: location.pathname,
        })
      }
    },
    [replaceScreen]
  )

  useHistoryPopEffect(
    {
      backward(location) {
        const { screens, screenInstances, screenInstancePtr } = store.getState()

        const matchScreen = Object.values(screens).find(
          (screen) =>
            screen &&
            matchPath(location.pathname, { exact: true, path: screen.path })
        )

        const searchParams = new URLSearchParams(location.search)
        const { screenInstanceId } = getNavigatorParams(searchParams)

        if (screenInstanceId && matchScreen) {
          const nextPtr = screenInstances.findIndex(
            (screenInstance) => screenInstance.id === screenInstanceId
          )

          mapScreenInstance({
            ptr: screenInstancePtr,
            mapper: (screenInstance) => ({
              ...screenInstance,
              nestedRouteCount: 0,
            }),
          })
          popScreen({
            depth: screenInstancePtr - nextPtr,
            targetScreenInstanceId: screenInstanceId,
          })
        } else if (screenInstances[screenInstancePtr]?.nestedRouteCount === 0) {
          popScreen({
            depth: 1,
          })
        } else {
          mapScreenInstance({
            ptr: screenInstancePtr,
            mapper: (screenInstance) => ({
              ...screenInstance,
              nestedRouteCount: screenInstance.nestedRouteCount - 1,
            }),
          })
        }
      },
      forward(location) {
        const { screens, screenInstancePtr } = store.getState()
        const searchParams = new URLSearchParams(location.search)
        const { screenInstanceId, present } = getNavigatorParams(searchParams)

        const matchScreen = Object.values(screens).find(
          (screen) =>
            screen &&
            matchPath(location.pathname, { exact: true, path: screen.path })
        )

        if (screenInstanceId && matchScreen) {
          pushScreen({
            screenId: matchScreen.id,
            screenInstanceId,
            present,
            as: location.pathname,
          })
        } else {
          mapScreenInstance({
            ptr: screenInstancePtr,
            mapper(screenInstance: ScreenInstance): ScreenInstance {
              return {
                ...screenInstance,
                nestedRouteCount: screenInstance.nestedRouteCount + 1,
              }
            },
          })
        }
      },
    },
    [popScreen, pushScreen]
  )

  return (
    <div
      className={classnames(styles.navigatorRoot, {
        'kf-android': props.theme === 'Android',
        'kf-cupertino': props.theme === 'Cupertino',
      })}
    >
      {props.children}
      <TransitionGroup component={null}>
        {screenInstances.map((screenInstance, index) => (
          <Transition
            key={index}
            screenInstance={screenInstance}
            screenInstanceIndex={index}
            isRoot={index === 0}
            isTop={index === screenInstancePtr}
            onClose={props.onClose}
          />
        ))}
      </TransitionGroup>
    </div>
  )
}

interface TransitionProps {
  screenInstance: ScreenInstance
  screenInstanceIndex: number
  isRoot: boolean
  isTop: boolean
  onClose?: () => void
}
const Transition: React.FC<TransitionProps> = (props) => {
  const navigatorOptions = useNavigatorOptions()
  const nodeRef = useRef<HTMLDivElement>(null)

  const { screens, screenInstancePtr, screenInstances } = useStoreSelector(
    (state) => ({
      screens: state.screens,
      screenInstancePtr: state.screenInstancePtr,
      screenInstances: state.screenInstances,
    })
  )

  const screen = screens[props.screenInstance.screenId]

  if (!screen) {
    return null
  }

  return (
    <CSSTransition
      key={props.screenInstance.id}
      nodeRef={nodeRef}
      timeout={navigatorOptions.animationDuration}
      in={props.screenInstanceIndex <= screenInstancePtr}
      unmountOnExit
    >
      <Card
        nodeRef={nodeRef}
        screenPath={screen.path}
        screenInstanceId={props.screenInstance.id}
        isRoot={props.screenInstanceIndex === 0}
        isTop={
          props.screenInstanceIndex >= screenInstancePtr ||
          (navigatorOptions.theme === 'Cupertino' &&
            screenInstances.length > props.screenInstanceIndex + 1 &&
            screenInstances[props.screenInstanceIndex + 1].present)
        }
        isPresent={props.screenInstance.present}
        onClose={props.onClose}
      >
        <screen.Component
          as={props.screenInstance.as}
          screenInstanceId={props.screenInstance.id}
          isTop={props.isTop}
          isRoot={props.isRoot}
        />
      </Card>
    </CSSTransition>
  )
}

export default Navigator

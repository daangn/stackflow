import classnames from 'clsx'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import {
  HashRouter,
  matchPath,
  useHistory,
  useLocation,
} from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { useStore } from '../lib/simple-store'

import { Card } from './components'
import { NavigatorOptionsProvider, useNavigatorOptions } from './contexts'
import {
  generateScreenInstanceId,
  getNavigatorParams,
  NavigatorParamKeys,
  NavigatorTheme,
} from './helpers'
import {
  useHistoryPopEffect,
  useHistoryPushEffect,
  useHistoryReplaceEffect,
} from './hooks/useHistoryEffect'
import styles from './Navigator.scss'
import {
  increaseScreenInstancePtr,
  insertScreenInstance,
  mapScreenInstance,
  ScreenInstance,
  setScreenInstancePtr,
  store,
} from './store'

const DEFAULT_CUPERTINO_ANIMATION_DURATION = 350
const DEFAULT_ANDROID_ANIMATION_DURATION = 270

/**
 * Navigator가 이미 초기화되었는지 확인
 * 한 개의 history stack을 사용하기 때문에, 한 개의 앱에는 한 개의 Navigator만 허용
 */
let isNavigatorInitialized = false

interface NavigatorProps {
  /**
   * 테마 (기본값: Web)
   */
  theme?: NavigatorTheme

  /**
   * 애니메이션 지속시간
   */
  animationDuration?: number

  /**
   * 빌트인 된 react-router-dom의 HashRouter를 없애고, 사용자가 직접 Router를 셋팅합니다
   */
  useCustomRouter?: boolean

  /**
   * 닫기 버튼을 눌렀을때 해당 콜백이 호출됩니다
   */
  onClose?: () => void

  /**
   * 네비게이션의 깊이가 변할때마다 해당 콜백이 호출됩니다
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
      <NavigatorScreens
        theme={props.theme ?? 'Android'}
        onClose={props.onClose}
        onDepthChange={props.onDepthChange}
      >
        {props.children}
      </NavigatorScreens>
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

  const screenInstances = useStore(store, (state) => state.screenInstances)
  const screenInstancePtr = useStore(store, (state) => state.screenInstancePtr)

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
    if (isNavigatorInitialized) {
      throw new Error('한 개의 앱에는 한 개의 Navigator만 허용됩니다')
    }

    const searchParams = new URLSearchParams(location.search)

    searchParams.set(
      NavigatorParamKeys.screenInstanceId,
      generateScreenInstanceId()
    )

    history.replace(`${location.pathname}?${searchParams.toString()}`)

    isNavigatorInitialized = true

    return () => {
      isNavigatorInitialized = false
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
    return store.listen((_, state) => {
      if (state.screenInstancePtr > -1) {
        props.onDepthChange?.(state.screenInstancePtr)
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
const Transition: React.FC<TransitionProps> = memo((props) => {
  const navigatorOptions = useNavigatorOptions()
  const nodeRef = useRef<HTMLDivElement>(null)

  const screen = useStore(
    store,
    (state) => state.screens[props.screenInstance.screenId]
  )
  const screenInstancePtr = useStore(store, (state) => state.screenInstancePtr)
  const screenInstances = useStore(store, (state) => {
    return state.screenInstances
  })

  if (!screen) {
    return null
  }

  const { Component } = screen

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
        <Component
          as={props.screenInstance.as}
          screenInstanceId={props.screenInstance.id}
          isTop={props.isTop}
          isRoot={props.isRoot}
        />
      </Card>
    </CSSTransition>
  )
})

export default Navigator

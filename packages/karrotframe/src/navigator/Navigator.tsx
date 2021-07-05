import classnames from 'clsx'
import qs from 'querystring'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import {
  HashRouter,
  matchPath,
  useHistory,
  useLocation,
} from 'react-router-dom'
import { useGlobalStore } from 'sagen'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import { NavigatorTheme } from '../types'
import { appendSearch, generateScreenInstanceId } from '../utils'
import { Card } from './components'
import { NavigatorOptionsProvider, useNavigatorOptions } from './contexts'
import {
  useHistoryPopEffect,
  useHistoryPushEffect,
  useHistoryReplaceEffect,
} from './hooks/useHistoryEffect'
import styles from './Navigator.scss'
import { store, dispatch, action, ScreenInstance } from './store'

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
  const [state] = useGlobalStore(store)

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
      const nextPointer = state.screenInstances.findIndex(
        (screenInstance) => screenInstance.id === screenInstanceId
      )

      if (nextPointer === -1) {
        dispatch(action.INSERT_SCREEN_INSTANCE, {
          ptr: state.screenInstancePointer,
          screenInstance: {
            id: screenInstanceId,
            screenId,
            present,
            as,
          },
        })
        dispatch(action.INC_SCREEN_INSTANCE_PTR)
      } else {
        dispatch(action.SET_SCREEN_INSTANCE_PTR, { ptr: nextPointer })
      }
    },
    [state]
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
      dispatch(action.INSERT_SCREEN_INSTANCE, {
        ptr: state.screenInstancePointer - 1,
        screenInstance: {
          id: screenInstanceId,
          screenId,
          present,
          as,
        },
      })
    },
    [state]
  )

  const popScreen = useCallback(
    ({
      depth,
      targetScreenInstanceId,
    }: {
      depth: number
      targetScreenInstanceId?: string
    }) => {
      if (targetScreenInstanceId) {
        const promise = state.screenInstancePromises[targetScreenInstanceId]

        if (promise && !promise.popped) {
          promise.resolve(null)
        }
      }
      dispatch(action.SET_SCREEN_INSTANCE_PTR, {
        ptr: state.screenInstancePointer - depth,
      })
    },
    [state]
  )

  useEffect(() => {
    if (isNavigatorInitialized) {
      throw new Error('한 개의 앱에는 한 개의 Navigator만 허용됩니다')
    }

    const [, search] = location.search.split('?')
    const _si = generateScreenInstanceId()

    history.replace(location.pathname + '?' + appendSearch(search, { _si }))

    isNavigatorInitialized = true

    return () => {
      isNavigatorInitialized = false
    }
  }, [])

  useEffect(() => {
    if (!location.search) {
      return
    }
    if (state.screenInstances.length > 0) {
      return
    }

    const [, search] = location.search.split('?')
    const { _si } = qs.parse(search) as {
      _si?: string
    }

    const matchScreen = Object.values(state.screens).find((screen) =>
      matchPath(location.pathname, { exact: true, path: screen.path })
    )

    if (_si && matchScreen) {
      pushScreen({
        screenId: matchScreen.id,
        screenInstanceId: _si,
        present: false,
        as: location.pathname,
      })
    }
  }, [location.search, state])

  useEffect(() => {
    return store.onSubscribe((store) => {
      if (store.screenInstancePointer > -1) {
        props.onDepthChange?.(store.screenInstancePointer)
      }
    })
  }, [props.onDepthChange, state])

  useHistoryPushEffect(
    (location) => {
      const [, search] = location.search.split('?')
      const { _si, _present } = qs.parse(search) as {
        _si?: string
        _present?: 'true'
      }

      const matchScreen = Object.values(state.screens).find((screen) =>
        matchPath(location.pathname, { exact: true, path: screen.path })
      )

      if (_si && matchScreen) {
        pushScreen({
          screenId: matchScreen.id,
          screenInstanceId: _si,
          present: _present === 'true',
          as: location.pathname,
        })
      } else {
        dispatch(action.MAP_SCREEN_INSTANCE, {
          ptr: state.screenInstancePointer,
          mapper(screenInstance: ScreenInstance): ScreenInstance {
            return {
              ...screenInstance,
              nestedRouteCount: screenInstance.nestedRouteCount + 1,
            }
          },
        })
      }
    },
    [state, pushScreen]
  )

  useHistoryReplaceEffect(
    (location) => {
      const [, search] = location.search.split('?')
      const { _si, _present } = qs.parse(search) as {
        _si?: string
        _present?: 'true'
      }

      const matchScreen = Object.values(state.screens).find((screen) =>
        matchPath(location.pathname, { exact: true, path: screen.path })
      )

      if (_si && matchScreen) {
        replaceScreen({
          screenId: matchScreen.id,
          screenInstanceId: _si,
          as: location.pathname,
          present: !!_present,
        })
      }
    },
    [state, replaceScreen]
  )

  useHistoryPopEffect(
    {
      backward(location) {
        const [, search] = location.search.split('?')
        const { _si } = qs.parse(search) as {
          _si?: string
        }

        const matchScreen = Object.values(state.screens).find((screen) =>
          matchPath(location.pathname, { exact: true, path: screen.path })
        )

        if (_si && matchScreen) {
          const nextPointer = state.screenInstances.findIndex(
            (screenInstance) => screenInstance.id === _si
          )

          dispatch(action.MAP_SCREEN_INSTANCE, {
            ptr: state.screenInstancePointer,
            mapper(screenInstance: ScreenInstance): ScreenInstance {
              return {
                ...screenInstance,
                nestedRouteCount: 0,
              }
            },
          })
          popScreen({
            depth: state.screenInstancePointer - nextPointer,
            targetScreenInstanceId: _si,
          })
        } else if (
          state.screenInstances[state.screenInstancePointer]
            ?.nestedRouteCount === 0
        ) {
          popScreen({
            depth: 1,
          })
        } else {
          dispatch(action.MAP_SCREEN_INSTANCE, {
            ptr: state.screenInstancePointer,
            mapper(screenInstance: ScreenInstance): ScreenInstance {
              return {
                ...screenInstance,
                nestedRouteCount: screenInstance.nestedRouteCount - 1,
              }
            },
          })
        }
      },
      forward(location) {
        const [, search] = location.search.split('?')
        const { _si, _present } = qs.parse(search) as {
          _si?: string
          _present?: 'true'
        }

        const matchScreen = Object.values(state.screens).find((screen) =>
          matchPath(location.pathname, { exact: true, path: screen.path })
        )

        if (_si && matchScreen) {
          pushScreen({
            screenId: matchScreen.id,
            screenInstanceId: _si,
            present: _present === 'true',
            as: location.pathname,
          })
        } else {
          dispatch(action.MAP_SCREEN_INSTANCE, {
            ptr: state.screenInstancePointer,
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
    [state, popScreen, pushScreen]
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
        {state.screenInstances.map((screenInstance, index) => (
          <Transition
            key={index}
            screenInstance={screenInstance}
            screenInstanceIndex={index}
            isRoot={index === 0}
            isTop={index === state.screenInstancePointer}
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
  const [state] = useGlobalStore(store)

  const { Component } = state.screens[props.screenInstance.screenId]

  return (
    <CSSTransition
      key={props.screenInstance.id}
      nodeRef={nodeRef}
      timeout={navigatorOptions.animationDuration}
      in={props.screenInstanceIndex <= state.screenInstancePointer}
      unmountOnExit
    >
      <Card
        nodeRef={nodeRef}
        screenPath={state.screens[props.screenInstance.screenId].path}
        screenInstanceId={props.screenInstance.id}
        isRoot={props.screenInstanceIndex === 0}
        isTop={
          props.screenInstanceIndex >= state.screenInstancePointer ||
          (navigatorOptions.theme === 'Cupertino' &&
            state.screenInstances.length > props.screenInstanceIndex + 1 &&
            state.screenInstances[props.screenInstanceIndex + 1].present)
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

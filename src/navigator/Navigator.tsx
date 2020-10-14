import qs from 'querystring'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { HashRouter, useLocation, useHistory, matchPath } from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { RecoilRoot, useRecoilState } from 'recoil'
import styled from '@emotion/styled'

import { NavigatorOptionsProvider, useNavigatorOptions } from './contexts'
import { NavigatorTheme } from '../types'
import { appendSearch, generateScreenInstanceId } from '../utils'
import { AtomScreens, AtomScreenInstancePointer, ScreenInstance, screenInstancePromises } from './atoms'
import { Card } from './components'
import { useScreenInstances } from './hooks/useScreenInstances'
import { useScreenInstancePointer } from './hooks/useScreenInstancePointer'
import { useHistoryPopEffect, useHistoryPushEffect, useHistoryReplaceEffect } from './hooks/useHistoryEffect'

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
   * 빌트인 된 RecoilRoot를 없애고, 사용자가 직접 RecoilRoot를 셋팅합니다
   */
  useCustomRecoilRoot?: boolean

  /**
   * 빌트인 된 react-router-dom의 HashRouter를 없애고, 사용자가 직접 Router를 셋팅합니다
   */
  useCustomRouter?: boolean

  /**
   * 닫기 버튼을 눌렀을때 해당 콜백이 호출됩니다
   */
  onClose?: () => void
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
      }}>
      <NavigatorScreens onClose={props.onClose}>{props.children}</NavigatorScreens>
    </NavigatorOptionsProvider>
  )

  if (!props.useCustomRecoilRoot) {
    h = <RecoilRoot>{h}</RecoilRoot>
  }
  if (!props.useCustomRouter) {
    h = <HashRouter>{h}</HashRouter>
  }

  return h
}

const NavigatorScreens: React.FC<NavigatorProps> = (props) => {
  const location = useLocation()
  const history = useHistory()

  const [screens] = useRecoilState(AtomScreens)
  const { screenInstancePointer, setScreenInstancePointer, increaseScreenInstancePointer } = useScreenInstancePointer()

  const { screenInstances, setScreenInstanceIn, pushScreenInstanceAfter } = useScreenInstances()

  const pushScreen = useCallback(
    ({ screenId, screenInstanceId }: { screenId: string; screenInstanceId: string }) => {
      const nextPointer = screenInstances.findIndex((screenInstance) => screenInstance.id === screenInstanceId)

      if (nextPointer === -1) {
        pushScreenInstanceAfter(screenInstancePointer, { screenId, screenInstanceId })
        increaseScreenInstancePointer()
      } else {
        setScreenInstancePointer(() => nextPointer)
      }
    },
    [screenInstances, setScreenInstancePointer, screenInstancePointer]
  )

  const replaceScreen = useCallback(
    ({ screenId, screenInstanceId }: { screenId: string; screenInstanceId: string }) => {
      pushScreenInstanceAfter(screenInstancePointer - 1, { screenId, screenInstanceId })
    },
    [pushScreenInstanceAfter]
  )

  const popScreen = useCallback(
    ({ depth, targetScreenInstanceId }: { depth: number; targetScreenInstanceId?: string }) => {
      if (targetScreenInstanceId) {
        screenInstancePromises[targetScreenInstanceId]?.(null)
      }
      setScreenInstancePointer((pointer) => pointer - depth)
    },
    [setScreenInstancePointer]
  )

  useEffect(() => {
    if (isNavigatorInitialized) {
      throw new Error('한 개의 앱에는 한 개의 Navigator만 허용됩니다')
    }

    const search = location.search.split('?')[1]
    const _si = generateScreenInstanceId()

    history.replace(location.pathname + '?' + appendSearch(search, { _si }))

    isNavigatorInitialized = true

    return () => {
      isNavigatorInitialized = false
    }
  }, [])

  useEffect(() => {
    if (screenInstances.length === 0) {
      const screen = Object.values(screens).find((screen) =>
        matchPath(location.pathname, { exact: true, path: screen.path })
      )

      if (screen) {
        const screenInstanceId = (qs.parse(location.search.split('?')[1])?._si as string | undefined) ?? ''
        pushScreen({
          screenId: screen.id,
          screenInstanceId,
        })
      }
    }
  }, [screens, screenInstances, screenInstancePointer])

  useHistoryPushEffect(
    (location) => {
      const screen = Object.values(screens).find((screen) =>
        matchPath(location.pathname, { exact: true, path: screen.path })
      )
      const screenInstanceId = qs.parse(location.search.split('?')[1])?._si as string | undefined

      if (screen && screenInstanceId) {
        pushScreen({
          screenId: screen.id,
          screenInstanceId,
        })
      } else {
        setScreenInstanceIn(screenInstancePointer, (screenInstance) => ({
          ...screenInstance,
          nestedRouteCount: screenInstance.nestedRouteCount + 1,
        }))
      }
    },
    [screens, pushScreen, setScreenInstanceIn, screenInstancePointer]
  )

  useHistoryReplaceEffect(
    (location) => {
      const screen = Object.values(screens).find((screen) =>
        matchPath(location.pathname, { exact: true, path: screen.path })
      )
      const screenInstanceId = qs.parse(location.search.split('?')[1])?._si as string | undefined

      if (screen && screenInstanceId) {
        replaceScreen({
          screenId: screen.id,
          screenInstanceId,
        })
      }
    },
    [screens, replaceScreen]
  )

  useHistoryPopEffect(
    {
      backward(location) {
        const screen = Object.values(screens).find((screen) =>
          matchPath(location.pathname, { exact: true, path: screen.path })
        )
        const screenInstanceId = qs.parse(location.search.split('?')[1])?._si as string | undefined

        if (screen && screenInstanceId) {
          const nextPointer = screenInstances.findIndex((screenInstance) => screenInstance.id === screenInstanceId)

          popScreen({
            depth: screenInstancePointer - nextPointer,
            targetScreenInstanceId: screenInstanceId,
          })
          setScreenInstanceIn(screenInstancePointer, (screenInstance) => ({
            ...screenInstance,
            nestedRouteCount: 0,
          }))
        } else if (screenInstances[screenInstancePointer]?.nestedRouteCount === 0) {
          popScreen({
            depth: 1,
          })
        } else {
          setScreenInstanceIn(screenInstancePointer, (screenInstance) => ({
            ...screenInstance,
            nestedRouteCount: screenInstance.nestedRouteCount - 1,
          }))
        }
      },
      forward(location) {
        const screen = Object.values(screens).find((screen) =>
          matchPath(location.pathname, { exact: true, path: screen.path })
        )
        const screenInstanceId = qs.parse(location.search.split('?')[1])?._si as string | undefined

        console.log(screen, screenInstanceId)

        if (screen && screenInstanceId) {
          pushScreen({
            screenId: screen.id,
            screenInstanceId,
          })
        } else if (screenInstances[screenInstancePointer]?.nestedRouteCount === 0) {
          setScreenInstanceIn(screenInstancePointer, (screenInstance) => ({
            ...screenInstance,
            nestedRouteCount: screenInstance.nestedRouteCount + 1,
          }))
        }
      },
    },
    [screens, screenInstances, popScreen, pushScreen, screenInstancePointer, setScreenInstanceIn]
  )

  const onClose = () => {
    props.onClose?.()
  }

  return useMemo(
    () => (
      <Root>
        {props.children}
        <TransitionGroup>
          {screenInstances.map((screenInstance, index) => (
            <Transition key={index} screenInstance={screenInstance} screenInstanceIndex={index} onClose={onClose} />
          ))}
        </TransitionGroup>
      </Root>
    ),
    [screenInstances]
  )
}

const Root = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  user-select: none;
`

interface TransitionProps {
  screenInstance: ScreenInstance
  screenInstanceIndex: number
  onClose: () => void
}
const Transition: React.FC<TransitionProps> = memo((props) => {
  const navigatorOptions = useNavigatorOptions()

  const [screens] = useRecoilState(AtomScreens)
  const [screenInstancePointer] = useRecoilState(AtomScreenInstancePointer)

  const nodeRef = useRef<HTMLDivElement>(null)

  const { Component } = screens[props.screenInstance.screenId]

  return (
    <CSSTransition
      key={props.screenInstance.id}
      nodeRef={nodeRef}
      timeout={navigatorOptions.animationDuration}
      in={props.screenInstanceIndex <= screenInstancePointer}
      unmountOnExit>
      <Card
        nodeRef={nodeRef}
        screenPath={screens[props.screenInstance.screenId].path}
        screenInstanceId={props.screenInstance.id}
        isRoot={props.screenInstanceIndex === 0}
        isTop={props.screenInstanceIndex === screenInstancePointer}
        onClose={props.onClose}>
        <Component screenInstanceId={props.screenInstance.id} />
      </Card>
    </CSSTransition>
  )
})

export default Navigator

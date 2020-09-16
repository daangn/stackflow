import qs from 'qs'
import React, { memo, useEffect, useMemo, useState } from 'react'
import { HashRouter, useLocation, useHistory, matchPath } from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { RecoilRoot, useRecoilState } from 'recoil'
import styled from '@emotion/styled'

import {
  AtomScreens,
  AtomScreenInstances,
  AtomScreenInstancePointer,
  ScreenInstance,
  screenInstancePromises,
} from './atoms'
import { Card } from './components'
import { NavigatorOptionsProvider, useNavigatorOptions } from './contexts'
import { Environment } from '../types'

const DEFAULT_ANIMATION_DURATION = 350

/**
 * Navigator가 이미 초기화되었는지 확인
 * 한 개의 history stack을 사용하기 때문에, 한 개의 앱에는 한 개의 Navigator만 허용
 */
let isNavigatorInitialized = false

interface NavigatorProps {
  /**
   * 환경
   */
  environment: Environment

  /**
   * 애니메이션 지속시간
   */
  animationDuration?: number

  /**
   * 닫기 버튼을 눌렀을때 해당 콜백이 호출됩니다
   */
  onClose?: () => void
}
const Navigator: React.FC<NavigatorProps> = (props) => {
  return (
    <HashRouter>
      <RecoilRoot>
        <NavigatorOptionsProvider
          value={{
            environment: props.environment,
            animationDuration: props.animationDuration ?? DEFAULT_ANIMATION_DURATION,
          }}>
          <NavigatorScreens onClose={props.onClose}>{props.children}</NavigatorScreens>
        </NavigatorOptionsProvider>
      </RecoilRoot>
    </HashRouter>
  )
}

const NavigatorScreens: React.FC<Omit<NavigatorProps, 'environment'>> = (props) => {
  const location = useLocation()
  const history = useHistory()

  const [screens] = useRecoilState(AtomScreens)
  const [screenInstances, setScreenInstances] = useRecoilState(AtomScreenInstances)
  const [screenInstancePointer, setScreenInstancePointer] = useRecoilState(AtomScreenInstancePointer)

  useEffect(() => {
    if (isNavigatorInitialized) {
      throw new Error('한 개의 앱에는 한 개의 Navigator만 허용됩니다')
    } else {
      // 초기화 작업
      isNavigatorInitialized = true
    }

    return () => {
      isNavigatorInitialized = false
    }
  }, [])

  useEffect(() => {
    function push({ screenId, screenInstanceId }: { screenId: string; screenInstanceId: string }) {
      const nextPointer = screenInstances.findIndex((screenInstance) => screenInstance.id === screenInstanceId)

      if (nextPointer === -1) {
        setScreenInstances((instances) => [
          ...instances.filter((_, index) => index <= screenInstancePointer),
          {
            id: screenInstanceId,
            screenId,
          },
        ])
        setScreenInstancePointer((pointer) => pointer + 1)
      } else {
        setScreenInstancePointer(() => nextPointer)
      }
    }

    function replace({ screenId, screenInstanceId }: { screenId: string; screenInstanceId: string }) {
      setScreenInstances((instances) => [
        ...instances.filter((_, index) => index < screenInstancePointer),
        {
          id: screenInstanceId,
          screenId,
        },
      ])
    }

    function pop({ depth, targetScreenInstanceId }: { depth: number; targetScreenInstanceId: string }) {
      screenInstancePromises[targetScreenInstanceId]?.(null)
      setScreenInstancePointer((pointer) => pointer - depth)
    }

    if (screenInstances.length === 0) {
      /**
       * 처음 Screen들이 초기화될 때,
       * 현재 path와 일치하는 스크린을 찾아서, 스택 맨 위로 넣어준다
       */

      const screen = Object.values(screens).find((screen) =>
        matchPath(location.pathname, { exact: true, path: screen.path })
      )

      if (screen) {
        /**
         * 앞으로 가기 기능 지원을 위한 ScreenInstance.id
         */
        const screenInstanceId = (qs.parse(location.search.split('?')[1])?.kf_sid as string | undefined) ?? ''
        push({
          screenId: screen.id,
          screenInstanceId,
        })
      }
    }

    const disposeListen = history.listen((location, action) => {
      switch (action) {
        /**
         * Link를 통해 push 했을 때,
         */
        case 'PUSH': {
          const screen = Object.values(screens).find((screen) =>
            matchPath(location.pathname, { exact: true, path: screen.path })
          )

          if (screen) {
            const screenInstanceId = qs.parse(location.search.split('?')[1])?.kf_sid as string
            push({
              screenId: screen.id,
              screenInstanceId,
            })
          }
          break
        }

        /**
         * Link를 통해 replace 했을 때,
         */
        case 'REPLACE': {
          const screen = Object.values(screens).find((screen) =>
            matchPath(location.pathname, { exact: true, path: screen.path })
          )

          if (screen) {
            const screenInstanceId = qs.parse(location.search.split('?')[1])?.kf_sid as string
            replace({
              screenId: screen.id,
              screenInstanceId,
            })
          }
          break
        }

        /**
         * 뒤로가기, 앞으로 가기 했을 때,
         */
        case 'POP': {
          const screen = Object.values(screens).find((screen) =>
            matchPath(location.pathname, { exact: true, path: screen.path })
          )

          if (screen) {
            const screenInstanceId = (qs.parse(location.search.split('?')[1])?.kf_sid as string | undefined) ?? ''
            const nextPointer = screenInstances.findIndex((screenInstance) => screenInstance.id === screenInstanceId)

            const isForward = nextPointer > screenInstancePointer || nextPointer === -1

            if (isForward) {
              push({
                screenId: screen.id,
                screenInstanceId,
              })
            } else {
              pop({
                depth: screenInstancePointer - nextPointer,
                targetScreenInstanceId: screenInstanceId,
              })
            }
          }

          break
        }
      }
    })

    return () => {
      disposeListen()
    }
  }, [screens, screenInstances, screenInstancePointer])

  const onClose = () => {
    props.onClose?.()
  }

  return useMemo(
    () => (
      <Root>
        {props.children}
        <TransitionGroup>
          {screenInstances.map((screenInstance, index) => (
            <Transition key={index} screenInstance={screenInstance} index={index} onClose={onClose} />
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
  index: number
  onClose: () => void
}
const Transition: React.FC<TransitionProps> = memo((props) => {
  const navigatorOptions = useNavigatorOptions()

  type TransitionState = 'enter-active' | 'enter-done' | 'exit-active' | 'exit-done'

  const [transitionState, setTransitionState] = useState<TransitionState | null>(null)
  const [screens] = useRecoilState(AtomScreens)
  const [screenInstancePointer] = useRecoilState(AtomScreenInstancePointer)

  const { Component } = screens[props.screenInstance.screenId]

  return (
    <CSSTransition
      key={props.screenInstance.id}
      timeout={navigatorOptions.animationDuration}
      in={props.index <= screenInstancePointer}
      unmountOnExit
      onEnter={() => {
        setTimeout(() => {
          setTransitionState('enter-active')
        }, 50)
      }}
      onEntered={() => {
        setTransitionState('enter-done')
      }}
      onExit={() => {
        setTransitionState('exit-active')
      }}
      onExited={() => {
        setTransitionState('exit-done')
      }}>
      <Card
        screenPath={screens[props.screenInstance.screenId].path}
        screenInstanceId={props.screenInstance.id}
        isRoot={props.index === 0}
        isTop={props.index === screenInstancePointer}
        onClose={props.onClose}
        enterActive={transitionState === 'enter-active'}
        enterDone={transitionState === 'enter-done'}
        exitActive={transitionState === 'exit-active'}
        exitDone={transitionState === 'exit-done'}>
        <Component screenInstanceId={props.screenInstance.id} />
      </Card>
    </CSSTransition>
  )
})

export default Navigator

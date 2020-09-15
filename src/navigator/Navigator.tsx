import React, { useEffect } from 'react'
import { HashRouter, useLocation, useHistory } from 'react-router-dom'
import styled from '@emotion/styled'
import { RecoilRoot, useRecoilState } from 'recoil' 
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { AtomScreens } from './atoms/Screens'
import { AtomScreenStack } from './atoms/ScreenStack'
import { NavigatorContext } from './contexts/NavigatorContext'
import Card from './components/Card'
import qs from 'qs'
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
   * 닫기 버튼을 눌렀을때 해당 콜백이 호출됩니다
   */
  onClose?: () => void

  /**
   * 애니메이션 지속시간
   */
  animationDuration?: number
}
const Navigator: React.FC<NavigatorProps> = (props) => {
  return (
    <HashRouter>
      <RecoilRoot>
        <NavigatorContext.Provider value={{
          environment: props.environment,
          animationDuration: props.animationDuration ?? DEFAULT_ANIMATION_DURATION,
        }}>
          <NavigatorScreens
            onClose={props.onClose}
          >
            {props.children}
          </NavigatorScreens>
        </NavigatorContext.Provider>
      </RecoilRoot>
    </HashRouter>
  )
}

const NavigatorScreens: React.FC<Omit<NavigatorProps, 'environment'>> = (props) => {
  const location = useLocation()
  const history = useHistory()

  const [screens] = useRecoilState(AtomScreens)
  const [screenStack, setScreenStack] = useRecoilState(AtomScreenStack)

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
    if (screenStack.length === 0) {
      /**
       * 처음 Screen들이 초기화될 때,
       * 현재 path와 일치하는 스크린을 찾아서, 스택 맨 위로 넣어준다
       */
      const matchedScreen = Object
        .values(screens)
        .find((screen) => screen.path === location.pathname)
      
      if (matchedScreen) {
        /**
         * 앞으로 가기 기능 지원을 위한 stackItemId
         */
        const stackItemId = qs.parse(location.search.split('?')[1])?.sid as string | undefined ?? ''
        setScreenStack(() => ([
          {
            id: stackItemId,
            screenId: matchedScreen.id,
          },
        ]))
      }
    }

    const disposeListen = history.listen((location, action) => {
      switch (action) {
        /**
         * Link를 통해 push 했을 때,
         */
        case 'PUSH': {
          const screen = Object
            .values(screens)
            .find((screen) => screen.path === location.pathname)
          
          if (screen) {
            const stackItemId = qs.parse(location.search.split('?')[1])?.sid as string
            setScreenStack((stack) => [
              ...stack,
              {
                id: stackItemId,
                screenId: screen.id,
              },
            ])
          }
          break
        }

        /**
         * Link를 통해 replace 했을 때,
         */
        case 'REPLACE': {
          const screen = Object
            .values(screens)
            .find((screen) => screen.path === location.pathname)
          
          if (screen) {
            const stackItemId = qs.parse(location.search.split('?')[1])?.sid as string
            setScreenStack((stack) => [
              ...stack.filter((_, index) => index < stack.length - 1),
              {
                id: stackItemId,
                screenId: screen.id,
              },
            ])
          }
          break
        }

        /**
         * 뒤로가기, 앞으로 가기 했을 때,
         */
        case 'POP': {
          const screen = Object
            .values(screens)
            .find((screen) => screen.path === location.pathname)

          if (screen) {
            const stackItemId = qs.parse(location.search.split('?')[1])?.sid as string | undefined ?? ''
            const isForward = screenStack.findIndex((stackItem) => stackItem.id === stackItemId) === -1

            if (isForward) {
              setScreenStack((stack) => [
                ...stack,
                {
                  id: stackItemId,
                  screenId: screen.id,
                },
              ])
            } else {
              setScreenStack((stack) => [
                ...stack.filter((_, index) => index < 1 + screenStack.findIndex((stackItem) => stackItem.id === stackItemId)),
              ])
            }
          }

          break
        }
      }
    })

    return () => {
      disposeListen()
    }
  }, [screens, screenStack])

  const onClose = () => {
    props.onClose?.()
  }

  return (
    <Root>
      {props.children}
      <TransitionGroup>
        {screenStack.map((stackItem, index) => {
          const { Component } = screens[stackItem.screenId]

          return (
            <CSSTransition key={index} timeout={500}>
              <Card
                isNavbar
                isRoot={index === 0}
                isTop={index === screenStack.length - 1}
                isUnderTop={index === screenStack.length - 2}
                onClose={onClose}
              >
                <Component stackItemId={stackItem.id} />
              </Card>
            </CSSTransition>
          )
        })}
      </TransitionGroup>
    </Root>
  )
}

const Root = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  user-select: none;
`

export default Navigator

import React, { useEffect } from 'react'
import { HashRouter, useLocation, useHistory } from 'react-router-dom'
import styled from '@emotion/styled'
import { RecoilRoot, useRecoilState } from 'recoil' 
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { AtomScreens } from './atoms/Screens'
import { AtomScreenInstances } from './atoms/ScreenInstances'
import { NavigatorContext, useNavigatorContext } from './contexts/NavigatorContext'
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
  
  const navigator = useNavigatorContext()

  const [screens] = useRecoilState(AtomScreens)
  const [screenInstances, setScreenInstances] = useRecoilState(AtomScreenInstances)

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
    function push({
      screenId,
      screenInstanceId,
    }: {
      screenId: string
      screenInstanceId: string
    }) {
      setScreenInstances((instances) => [
        ...instances,
        {
          id: screenInstanceId,
          screenId,
          navbar: {
            title: '',
            visible: false,
          }
        },
      ])
    }

    function replace({
      screenId,
      screenInstanceId,
    }: {
      screenId: string
      screenInstanceId: string
    }) {
      setScreenInstances((instances) => [
        ...instances.filter((_, index) => index < instances.length - 1),
        {
          id: screenInstanceId,
          screenId,
          navbar: {
            title: '',
            visible: false,
          }
        },
      ])
    }

    function pop({
      depth,
    }: {
      depth: number
    }) {
      setScreenInstances((instances) => [
        ...instances.filter((_, index) => index < instances.length - depth),
      ])
    }

    if (screenInstances.length === 0) {
      /**
       * 처음 Screen들이 초기화될 때,
       * 현재 path와 일치하는 스크린을 찾아서, 스택 맨 위로 넣어준다
       */
      const screen = Object
        .values(screens)
        .find((screen) => screen.path === location.pathname)
      
      if (screen) {
        /**
         * 앞으로 가기 기능 지원을 위한 ScreenInstance.id
         */
        const screenInstanceId = qs.parse(location.search.split('?')[1])?.kf_sid as string | undefined ?? ''
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
          const screen = Object
            .values(screens)
            .find((screen) => screen.path === location.pathname)
          
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
          const screen = Object
            .values(screens)
            .find((screen) => screen.path === location.pathname)
          
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
          const screen = Object
            .values(screens)
            .find((screen) => screen.path === location.pathname)

          if (screen) {
            const screenInstanceId = qs.parse(location.search.split('?')[1])?.kf_sid as string | undefined ?? ''
            const isForward = screenInstances.findIndex((screenInstance) => screenInstance.id === screenInstanceId) === -1

            if (isForward) {
              push({
                screenId: screen.id,
                screenInstanceId,
              })
            } else {
              pop({
                depth: screenInstances.length - 1 - screenInstances.findIndex((screenInstance) => screenInstance.id === screenInstanceId)
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
  }, [screens, screenInstances])

  const onClose = () => {
    props.onClose?.()
  }

  return (
    <Root>
      {props.children}
      <TransitionGroup>
        {screenInstances.map((screenInstance, index) => {
          const { Component } = screens[screenInstance.screenId]

          return (
            <CSSTransition key={index} timeout={navigator.animationDuration}>
              <Card
                screenInstanceId={screenInstance.id}
                isNavbar
                isRoot={index === 0}
                isTop={index === screenInstances.length - 1}
                isUnderTop={index === screenInstances.length - 2}
                onClose={onClose}
              >
                <Component screenInstanceId={screenInstance.id} />
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

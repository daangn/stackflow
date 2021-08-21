import React from 'react'
import { CSSTransition } from 'react-transition-group'

import { useNavigatorOptions } from '../contexts'
import { NavigatorTheme } from '../helpers'
import { useStoreSelector } from '../store'
import NodeRef from './_lib/NodeRef'
import Card from './Card'
import {
  container_enterActive,
  container_enterDone,
  container_exitActive,
  container_exitDone,
} from './Card.css'
import useDepthChangeEffect from './Stack.useDepthChangeEffect'
import useInitialize from './Stack.useInitialize'
import useInitializeHistoryPopEffect from './Stack.useInitializeHistoryPopEffect'
import { useInitializeHistoryPushEffect } from './Stack.useInitializeHistoryPushEffect'
import { useInitializeHistoryReplaceEffect } from './Stack.useInitializeHistoryReplaceEffect'

declare global {
  interface Window {
    __KARROTFRAME__?: boolean
  }
}

interface StackProps {
  theme: NavigatorTheme
  onClose?: () => void
  onDepthChange?: (depth: number) => void
}
const Stack: React.FC<StackProps> = (props) => {
  const navigatorOptions = useNavigatorOptions()

  const { screens, screenInstances, screenInstancePtr } = useStoreSelector(
    (state) => ({
      screens: state.screens,
      screenInstances: state.screenInstances,
      screenInstancePtr: state.screenInstancePtr,
    })
  )

  useDepthChangeEffect(props.onDepthChange)

  useInitialize()
  useInitializeHistoryPushEffect()
  useInitializeHistoryReplaceEffect()
  useInitializeHistoryPopEffect()

  return (
    <>
      {screenInstances.map((screenInstance, screenInstanceIndex) => {
        const isRoot = screenInstanceIndex === 0
        const isTop = screenInstanceIndex === screenInstancePtr

        const screen = screens[screenInstance.screenId]

        if (!screen) {
          return null
        }

        return (
          <NodeRef<HTMLDivElement> key={screenInstanceIndex}>
            {(nodeRef) => (
              <CSSTransition
                key={screenInstance.id}
                nodeRef={nodeRef}
                timeout={navigatorOptions.animationDuration}
                in={screenInstanceIndex <= screenInstancePtr}
                classNames={{
                  enterActive: container_enterActive,
                  enterDone: container_enterDone,
                  exitActive: container_exitActive,
                  exitDone: container_exitDone,
                }}
                unmountOnExit
              >
                <Card
                  nodeRef={nodeRef}
                  screenPath={screen.path}
                  screenInstanceId={screenInstance.id}
                  isRoot={screenInstanceIndex === 0}
                  isTop={
                    screenInstanceIndex >= screenInstancePtr ||
                    (navigatorOptions.theme === 'Cupertino' &&
                      screenInstances.length > screenInstanceIndex + 1 &&
                      screenInstances[screenInstanceIndex + 1].present)
                  }
                  isPresent={screenInstance.present}
                  onClose={props.onClose}
                >
                  <screen.Component
                    as={screenInstance.as}
                    screenInstanceId={screenInstance.id}
                    isTop={isTop}
                    isRoot={isRoot}
                  />
                </Card>
              </CSSTransition>
            )}
          </NodeRef>
        )
      })}
      {props.children}
    </>
  )
}

export default Stack

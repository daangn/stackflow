import React, { useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { useScreenInstances, useScreens } from '../globalState'
import { INavigatorTheme } from '../types'
import NodeRef from './_lib/NodeRef'
import Card from './Card'
import {
  container_enterActive,
  container_enterDone,
  container_exitActive,
  container_exitDone,
} from './Card.css'
import { ProviderScreenHelmet } from './Stack.ScreenHelmetContext'
import { ProviderScreenInstance } from './Stack.ScreenInstanceContext'
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

interface IStackProps {
  theme: INavigatorTheme
  animationDuration: number
  backButtonAriaLabel: string
  closeButtonAriaLabel: string
  onClose?: () => void
  onDepthChange?: (depth: number) => void
}
const Stack: React.FC<IStackProps> = (props) => {
  const beforeTopFrameOffsetRef = useRef<HTMLDivElement>(null)

  const { screens } = useScreens()
  const { screenInstances, screenInstancePtr } = useScreenInstances()

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
                timeout={props.animationDuration}
                in={screenInstanceIndex <= screenInstancePtr}
                classNames={{
                  enterActive: container_enterActive,
                  enterDone: container_enterDone,
                  exitActive: container_exitActive,
                  exitDone: container_exitDone,
                }}
                unmountOnExit
              >
                <ProviderScreenInstance
                  screenInstanceId={screenInstance.id}
                  screenPath={screen.path}
                  as={screenInstance.as}
                  isTop={isTop}
                  isRoot={isRoot}
                >
                  <ProviderScreenHelmet>
                    <Card
                      nodeRef={nodeRef}
                      beforeTopFrameOffsetRef={beforeTopFrameOffsetRef}
                      theme={props.theme}
                      screenPath={screen.path}
                      screenInstanceId={screenInstance.id}
                      isRoot={screenInstanceIndex === 0}
                      isTop={
                        screenInstanceIndex >= screenInstancePtr ||
                        (props.theme === 'Cupertino' &&
                          screenInstances.length > screenInstanceIndex + 1 &&
                          screenInstances[screenInstanceIndex + 1].present)
                      }
                      isBeforeTop={
                        screenInstanceIndex === screenInstancePtr - 1
                      }
                      isPresent={screenInstance.present}
                      backButtonAriaLabel={props.backButtonAriaLabel}
                      closeButtonAriaLabel={props.closeButtonAriaLabel}
                      onClose={props.onClose}
                    >
                      <screen.Component />
                    </Card>
                  </ProviderScreenHelmet>
                </ProviderScreenInstance>
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

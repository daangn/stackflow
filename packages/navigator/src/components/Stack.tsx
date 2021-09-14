import React, { useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { useScreenInstances, useScreens } from '../globalState'
import { INavigatorTheme } from '../types'
import Fallbacked from './_lib/Fallbacked'
import NodeRef from './_lib/NodeRef'
import OnMount from './_lib/OnMount'
import Card from './Card'
import {
  container_enterActive,
  container_enterDone,
  container_exitActive,
  container_exitDone,
} from './Card.css'
import CardFallback from './CardFallback'
import { ScreenHelmetProvider } from './Stack.ScreenHelmetContext'
import { ScreenInstanceProvider } from './Stack.ScreenInstanceContext'
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
      {Array(screenInstances.length + 1)
        .fill('')
        .map((_, i) => {
          const screenInstanceIndex = i
          const isRoot = screenInstanceIndex === 0
          const isTop = screenInstanceIndex === screenInstancePtr

          const screenInstance = screenInstances[i]
          const screen = screens[screenInstance?.screenId]

          const renderNode = ({
            fallback,
            fallbacked,
            onMount,
            onUnmount,
          }: {
            fallback: boolean
            fallbacked?: boolean
            onMount: () => void
            onUnmount: () => void
          }) => (
            <NodeRef<HTMLDivElement> key={screenInstanceIndex}>
              {(nodeRef) => (
                <>
                  <OnMount onMount={onMount} onUnmount={onUnmount} />
                  {screen && (
                    <CSSTransition
                      key={screenInstanceIndex}
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
                      {fallback ? (
                        <CardFallback
                          nodeRef={nodeRef}
                          theme={props.theme}
                          isRoot={screenInstanceIndex === 0}
                          isPresent={screenInstance.present}
                        />
                      ) : (
                        <ScreenInstanceProvider
                          screenInstanceId={screenInstance.id}
                          screenPath={screen.path}
                          as={screenInstance.as}
                          isTop={isTop}
                          isRoot={isRoot}
                        >
                          <ScreenHelmetProvider>
                            <Card
                              nodeRef={nodeRef}
                              className={
                                fallbacked ? container_enterDone : undefined
                              }
                              theme={props.theme}
                              screenPath={screen.path}
                              screenInstanceId={screenInstance.id}
                              isRoot={screenInstanceIndex === 0}
                              isTop={
                                screenInstanceIndex >= screenInstancePtr ||
                                (props.theme === 'Cupertino' &&
                                  screenInstances.length >
                                    screenInstanceIndex + 1 &&
                                  screenInstances[screenInstanceIndex + 1]
                                    .present)
                              }
                              isPresent={screenInstance.present}
                              isBeforeTop={
                                screenInstanceIndex === screenInstancePtr - 1
                              }
                              beforeTopFrameOffsetRef={beforeTopFrameOffsetRef}
                              backButtonAriaLabel={props.backButtonAriaLabel}
                              closeButtonAriaLabel={props.closeButtonAriaLabel}
                              onClose={props.onClose}
                            >
                              <screen.Component />
                            </Card>
                          </ScreenHelmetProvider>
                        </ScreenInstanceProvider>
                      )}
                    </CSSTransition>
                  )}
                </>
              )}
            </NodeRef>
          )

          return (
            <Fallbacked key={i}>
              {(setFallbacked, fallbacked) => (
                <React.Suspense
                  fallback={renderNode({
                    fallback: true,
                    onMount() {
                      setFallbacked(true)
                    },
                    onUnmount() {},
                  })}
                >
                  {renderNode({
                    fallback: false,
                    fallbacked,
                    onMount() {},
                    onUnmount() {
                      setFallbacked(false)
                    },
                  })}
                </React.Suspense>
              )}
            </Fallbacked>
          )
        })}
      {props.children}
    </>
  )
}

export default Stack

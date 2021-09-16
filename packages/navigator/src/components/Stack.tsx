import React, { useRef } from 'react'

import { useScreenInstances, useScreens } from '../globalState'
import { INavigatorTheme } from '../types'
import SuspenseTransition from './_lib/SuspenseTransition'
import Card from './Card'
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
          const isTop = screenInstanceIndex >= screenInstancePtr
          const isNextPresent =
            screenInstances[screenInstanceIndex + 1]?.present

          const screenInstance = screenInstances[i]
          const screen = screens[screenInstance?.screenId]

          return (
            <SuspenseTransition
              key={screenInstanceIndex}
              timeout={props.animationDuration}
              in={isRoot || screenInstanceIndex <= screenInstancePtr}
              fallback={(status) => (
                <CardFallback
                  status={status}
                  theme={props.theme}
                  isRoot={screenInstanceIndex === 0}
                  isPresent={screenInstance?.present}
                />
              )}
            >
              {(status, mount) =>
                screen && (
                  <ScreenInstanceProvider
                    screenInstanceId={screenInstance.id}
                    screenPath={screen.path}
                    as={screenInstance.as}
                    isTop={isTop}
                    isRoot={isRoot}
                  >
                    <ScreenHelmetProvider>
                      <Card
                        status={status}
                        mount={mount}
                        theme={props.theme}
                        screenPath={screen.path}
                        screenInstanceId={screenInstance.id}
                        isRoot={screenInstanceIndex === 0}
                        isTop={
                          isTop ||
                          (props.theme === 'Cupertino' && isNextPresent)
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
                )
              }
            </SuspenseTransition>
          )
        })}
      {props.children}
    </>
  )
}

export default Stack

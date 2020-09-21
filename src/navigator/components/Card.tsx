import React, { useCallback, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { css } from '@emotion/core'
import styled from '@emotion/styled'

import Navbar from './Navbar'
import { NavigatorOptions, useNavigatorOptions } from '../contexts'
import { AtomScreenInstanceOptions, AtomScreenEdge } from '../atoms'

interface CardProps {
  nodeRef: React.RefObject<HTMLDivElement>
  screenPath: string
  screenInstanceId: string
  isRoot: boolean
  isTop: boolean
  onClose: () => void
}
const Card: React.FC<CardProps> = (props) => {
  const history = useHistory()

  const navigatorOptions = useNavigatorOptions()

  const [screenInstanceOptions] = useRecoilState(AtomScreenInstanceOptions)
  const [screenEdge, setScreenEdge] = useRecoilState(AtomScreenEdge)

  const screenInstanceOption = screenInstanceOptions[props.screenInstanceId]

  const x = useRef<number>(0)

  const $frameContainer = useRef<HTMLDivElement>(null)

  const onEdgeTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      setScreenEdge({
        startX: e.touches[0].clientX,
        startTime: Date.now(),
      })
    },
    [setScreenEdge]
  )

  const onEdgeTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (screenEdge.startX) {
        x.current = e.touches[0].clientX as any
      }
    },
    [screenEdge]
  )

  const onEdgeTouchEnd = useCallback(() => {
    if (x.current) {
      const velocity = x.current / (Date.now() - (screenEdge.startTime as number))

      if (velocity > 1 || x.current / window.screen.width > 0.4) {
        history.goBack()
      }

      setScreenEdge({
        startX: null,
        startTime: null,
      })
      x.current = 0
    }
  }, [screenEdge, setScreenEdge])

  useEffect(() => {
    let stopped = false

    if (screenEdge.startX === null) {
      requestAnimationFrame(() => {
        if ($frameContainer.current) {
          $frameContainer.current.style.cssText = ''
        }
      })
    } else if (props.isTop) {
      animate()

      return () => {
        stopped = true
      }
    }

    function animate() {
      requestAnimationFrame(() => {
        const computedEdgeX = x.current - screenEdge.startX!

        if (computedEdgeX >= 0) {
          if ($frameContainer.current) {
            $frameContainer.current.style.cssText = `
                overflow-y: hidden;
                transform: translateX(${computedEdgeX}px); transition: transform 0s;
              `
          }
        }

        if (!stopped) {
          animate()
        }
      })
    }
  }, [screenEdge, props.isTop])

  return (
    <TransitionNode ref={props.nodeRef} navigatorOptions={navigatorOptions}>
      <MainOffset navigatorOptions={navigatorOptions} isTop={props.isTop}>
        <Main
          className="css-card-main"
          navigatorOptions={navigatorOptions}
          navbarVisible={!!screenInstanceOption?.navbar.visible}
          isRoot={props.isRoot}
          isTop={props.isTop}>
          {!!screenInstanceOption?.navbar.visible && (
            <Navbar
              screenInstanceId={props.screenInstanceId}
              theme={navigatorOptions.theme}
              isRoot={props.isRoot}
              onClose={props.onClose}
            />
          )}
          <FrameOffset className="css-card-frame-offset" navigatorOptions={navigatorOptions} isTop={props.isTop}>
            <Frame
              className="css-card-frame"
              ref={$frameContainer}
              navigatorOptions={navigatorOptions}
              isRoot={props.isRoot}>
              {props.children}
              {navigatorOptions.theme === 'Cupertino' && !props.isRoot && (
                <Edge onTouchStart={onEdgeTouchStart} onTouchMove={onEdgeTouchMove} onTouchEnd={onEdgeTouchEnd} />
              )}
            </Frame>
          </FrameOffset>
        </Main>
      </MainOffset>
    </TransitionNode>
  )
}

interface LayerProps {
  navigatorOptions: NavigatorOptions
}
const TransitionNode = styled.div<LayerProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  ${(props) => {
    switch (props.navigatorOptions.theme) {
      case 'Cupertino':
        return css`
          &.enter-active,
          &.enter-done {
            .css-card-frame {
              transform: translateX(0);
            }
          }

          &.exit-active,
          &.exit-done {
            .css-card-frame {
              transform: translateX(100%);
            }
            .css-kf-navbar-container {
              display: none;
            }
          }
        `
      case 'Android':
        return css`
          &.enter-active,
          &.enter-done {
            .css-card-main {
              opacity: 1;
              transform: translateY(0);
            }
          }

          &.exit-active,
          &.exit-done {
            .css-card-main {
              opacity: 0;
              transform: translateY(10rem);
            }
          }
        `
    }
  }}
`

interface MainOffsetProps {
  navigatorOptions: NavigatorOptions
  isTop: boolean
}
const MainOffset = styled.div<MainOffsetProps>`
  width: 100%;
  height: 100%;
  transition: transform ${(props) => props.navigatorOptions.animationDuration}ms;

  ${(props) =>
    props.navigatorOptions.theme === 'Android' &&
    !props.isTop &&
    css`
      transform: translateY(-2rem);
    `}
`

interface MainProps {
  navigatorOptions: NavigatorOptions
  navbarVisible?: boolean
  isRoot: boolean
  isTop: boolean
}
const Main = styled.div<MainProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  ${(props) => {
    if (!props.navbarVisible) {
      return null
    }

    switch (props.navigatorOptions.theme) {
      case 'Cupertino':
        return css`
          padding-top: 2.75rem;
        `
      case 'Android':
        return css`
          padding-top: 3.5rem;
        `
    }
  }}

  ${(props) =>
    props.navigatorOptions.theme === 'Android' &&
    css`
      opacity: 0;
      transform: translateY(10rem);
      transition: transform ${props.navigatorOptions.animationDuration}ms,
        opacity ${props.navigatorOptions.animationDuration}ms;
      transition-timing-function: cubic-bezier(0.22, 0.67, 0.39, 0.83);
      will-change: transform, opacity;

      ${props.isRoot &&
      css`
        opacity: 1;
        transform: translateY(0);
      `}
    `}
`

interface FrameOffsetProps {
  navigatorOptions: NavigatorOptions
  isTop: boolean
}
const FrameOffset = styled.div<FrameOffsetProps>`
  width: 100%;
  height: 100%;
  transition: transform ${(props) => props.navigatorOptions.animationDuration}ms;

  ${(props) =>
    props.navigatorOptions.theme === 'Cupertino' &&
    !props.isTop &&
    css`
      transform: translateX(-2rem);
    `}
`

interface FrameProps {
  navigatorOptions: NavigatorOptions
  isRoot: boolean
}
const Frame = styled.div<FrameProps>`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  background-color: #fff;

  ${(props) =>
    props.navigatorOptions.theme === 'Cupertino' &&
    css`
      transform: translateX(0);
      transition: transform ${props.navigatorOptions.animationDuration}ms;
      will-change: transform;

      ${!props.isRoot &&
      css`
        transform: translateX(100%);
      `}
    `};
`

const Edge = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 1.25rem;
`

export default Card

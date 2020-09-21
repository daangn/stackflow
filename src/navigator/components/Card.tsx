import React, { useCallback, useEffect, useMemo, useRef } from 'react'
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

  const $allFrameOffsets = useMemo(
    // eslint-disable-next-line
    () => document.getElementsByClassName('css-card-frame-offset') as HTMLCollectionOf<HTMLDivElement>,
    []
  )

  const $dim = useRef<HTMLDivElement>(null)
  const $frame = useRef<HTMLDivElement>(null)
  const $frameOffset = useRef<HTMLDivElement>(null)

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
        if ($dim.current) {
          $dim.current.style.cssText = ''
        }
        if ($frame.current) {
          $frame.current.style.cssText = ''
        }
        for (let i = 0; i < $allFrameOffsets.length; i++) {
          $allFrameOffsets[i].style.cssText = ``
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
          if ($dim.current) {
            $dim.current.style.cssText = `
              opacity: ${1 - computedEdgeX / window.screen.width};
              transition: opacity 0s;
            `
          }
          if ($frame.current) {
            $frame.current.style.cssText = `
                overflow-y: hidden;
                transform: translateX(${computedEdgeX}px); transition: transform 0s;
              `
          }
          for (let i = 0; i < $allFrameOffsets.length; i++) {
            if ($allFrameOffsets[i] !== $frameOffset.current) {
              $allFrameOffsets[i].style.cssText = `
                transform: translateX(-${5 - (5 * computedEdgeX) / window.screen.width}rem);
                transition: 0s;
              `
            }
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
      <Dim
        ref={$dim}
        className="css-card-dim"
        navigatorOptions={navigatorOptions}
        navbarVisible={!!screenInstanceOption?.navbar.visible}
      />
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
          <FrameOffset
            ref={$frameOffset}
            className="css-card-frame-offset"
            navigatorOptions={navigatorOptions}
            isTop={props.isTop}>
            <Frame className="css-card-frame" ref={$frame} navigatorOptions={navigatorOptions} isRoot={props.isRoot}>
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
  overflow: hidden;

  ${(props) =>
    props.navigatorOptions.theme === 'Cupertino' &&
    css`
      &.enter-active,
      &.enter-done {
        .css-card-dim {
          opacity: 1;
        }
        .css-card-frame {
          transform: translateX(0);
        }
      }

      &.exit-active,
      &.exit-done {
        .css-card-dim {
          opacity: 0;
        }
        .css-card-frame {
          transform: translateX(100%);
        }
        .css-card-frame-offset {
          transform: translateX(0);
        }
        .css-kf-navbar-container {
          display: none;
        }
      }
    `}

  ${(props) =>
    props.navigatorOptions.theme === 'Android' &&
    css`
      &.enter-active,
      &.enter-done {
        .css-card-dim {
          opacity: 1;
        }
        .css-card-main {
          opacity: 1;
          transform: translateY(0);
        }
      }

      &.exit-active,
      &.exit-done {
        .css-card-dim {
          opacity: 0;
        }
        .css-card-main {
          opacity: 0;
          transform: translateY(10rem);
        }
      }
    `}
`

interface DimProps {
  navigatorOptions: NavigatorOptions
  navbarVisible: boolean
}
const Dim = styled.div<DimProps>`
  background-color: rgba(0, 0, 0, 0.15);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity ${(props) => props.navigatorOptions.animationDuration}ms;
  will-change: opacity;

  ${(props) =>
    props.navigatorOptions.theme === 'Cupertino' &&
    css`
      ${props.navbarVisible &&
      css`
        top: 2.75rem;
      `}
    `}

  ${(props) =>
    props.navigatorOptions.theme === 'Android' &&
    css`
      height: 10rem;
      background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0));
    `}
`

interface MainOffsetProps {
  navigatorOptions: NavigatorOptions
  isTop: boolean
}
const MainOffset = styled.div<MainOffsetProps>`
  width: 100%;
  height: 100%;
  transition: transform ${(props) => props.navigatorOptions.animationDuration}ms;
  will-change: transform;

  ${(props) =>
    props.navigatorOptions.theme === 'Android' &&
    css`
      ${!props.isTop &&
      css`
        transform: translateY(-2rem);
      `}
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

  ${(props) =>
    props.navigatorOptions.theme === 'Cupertino' &&
    css`
      ${props.navbarVisible &&
      css`
        padding-top: 2.75rem;
      `}
    `}

  ${(props) =>
    props.navigatorOptions.theme === 'Android' &&
    css`
      opacity: 0;
      transform: translateY(10rem);
      transition: transform ${props.navigatorOptions.animationDuration}ms,
        opacity ${props.navigatorOptions.animationDuration}ms;
      transition-timing-function: cubic-bezier(0.22, 0.67, 0.39, 0.83);
      will-change: transform, opacity;

      ${props.navbarVisible &&
      css`
        padding-top: 3.5rem;
      `}

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
  will-change: transition;

  ${(props) =>
    props.navigatorOptions.theme === 'Cupertino' &&
    css`
      ${!props.isTop &&
      css`
        transform: translateX(-5rem);
      `}
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
  --webkit-overflow-scrolling: touch;

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

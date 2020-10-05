import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { css } from '@emotion/core'
import styled from '@emotion/styled'

import { AtomScreenInstanceOptions, AtomScreenEdge } from '../atoms'
import { NavigatorOptions, useNavigatorOptions } from '../contexts'
import Navbar, { Container as NavbarContainer } from './Navbar'

const $allFrameOffsetElements = new Set<HTMLDivElement>()

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
  const screenInstanceOption = screenInstanceOptions[props.screenInstanceId]

  // 플리커링 방지를 위한 loading state
  const [loading, setLoading] = useState(props.isRoot)

  useEffect(() => {
    setTimeout(() => setLoading(false), 0)
  }, [])

  // 스와이프 백 애니메이션 처리
  const x = useRef<number>(0)

  const [screenEdge, setScreenEdge] = useRecoilState(AtomScreenEdge)

  const dimRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const frameOffsetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const $frameOffset = frameOffsetRef.current

    if ($frameOffset) {
      $allFrameOffsetElements.add($frameOffset)

      return () => {
        $allFrameOffsetElements.delete($frameOffset)
      }
    }
  }, [frameOffsetRef.current])

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
      e.preventDefault()
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

    // 현재 스와이프 중이라면, requestAnimFrame 무한 recursive 루프를 돌면서,
    // x 값을 이용해 스타일을 계산 및 할당
    if (screenEdge.startX === null) {
      requestAnimationFrame(() => {
        const $dim = dimRef.current
        const $frame = frameRef.current

        if ($dim) {
          $dim.style.cssText = ''
        }
        if ($frame) {
          $frame.style.cssText = ''
        }
        $allFrameOffsetElements.forEach(($frameOffset) => {
          $frameOffset.style.cssText = ''
        })
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

        const $dim = dimRef.current
        const $frame = frameRef.current

        if (computedEdgeX >= 0) {
          if ($dim) {
            $dim.style.cssText = `
              opacity: ${1 - computedEdgeX / window.screen.width};
              transition: opacity 0s;
            `
          }
          if ($frame) {
            $frame.style.cssText = `
              overflow-y: hidden;
              transform: translateX(${computedEdgeX}px); transition: transform 0s;
            `
          }
          $allFrameOffsetElements.forEach(($frameOffset) => {
            if ($frameOffset !== frameOffsetRef.current) {
              $frameOffset.style.cssText = `
                transform: translateX(-${5 - (5 * computedEdgeX) / window.screen.width}rem);
                transition: 0s;
              `
            }
          })
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
        ref={dimRef}
        navigatorOptions={navigatorOptions}
        isNavbarVisible={!!screenInstanceOption?.navbar.visible}
        isLoading={loading}
      />
      <MainOffset navigatorOptions={navigatorOptions} isTop={props.isTop} isLoading={loading}>
        <Main
          navigatorOptions={navigatorOptions}
          isNavbarVisible={!!screenInstanceOption?.navbar.visible}
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
          <FrameOffset ref={frameOffsetRef} navigatorOptions={navigatorOptions} isTop={props.isTop}>
            <Frame ref={frameRef} navigatorOptions={navigatorOptions} isRoot={props.isRoot}>
              {props.children}
            </Frame>
          </FrameOffset>
          {navigatorOptions.theme === 'Cupertino' && !props.isRoot && (
            <Edge
              navigatorOptions={navigatorOptions}
              isNavbarVisible={!!screenInstanceOption?.navbar.visible}
              onTouchStart={onEdgeTouchStart}
              onTouchMove={onEdgeTouchMove}
              onTouchEnd={onEdgeTouchEnd}
            />
          )}
          {screenInstanceOption?.fixed?.top && (
            <Fixed
              position="top"
              navigatorOptions={navigatorOptions}
              isNavbarVisible={!!screenInstanceOption?.navbar.visible}
              style={screenInstanceOption.fixed.top.style}>
              {screenInstanceOption.fixed.top.node}
            </Fixed>
          )}
          {screenInstanceOption?.fixed?.bottom && (
            <Fixed
              position="bottom"
              navigatorOptions={navigatorOptions}
              isNavbarVisible={!!screenInstanceOption?.navbar.visible}
              style={screenInstanceOption.fixed.bottom.style}>
              {screenInstanceOption.fixed.bottom.node}
            </Fixed>
          )}
        </Main>
      </MainOffset>
    </TransitionNode>
  )
}

interface DimProps {
  navigatorOptions: NavigatorOptions
  isNavbarVisible: boolean
  isLoading: boolean
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
    props.isLoading &&
    css`
      display: none;
    `}

  ${(props) =>
    props.navigatorOptions.theme === 'Cupertino' &&
    css`
      ${props.isNavbarVisible &&
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
  isLoading: boolean
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

  ${(props) =>
    props.isLoading &&
    css`
      display: none;
    `}
`

interface MainProps {
  navigatorOptions: NavigatorOptions
  isNavbarVisible?: boolean
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
      ${props.isNavbarVisible &&
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

      ${props.isNavbarVisible &&
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
  -webkit-overflow-scrolling: touch;

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

interface FixedProps {
  navigatorOptions: NavigatorOptions
  position: 'top' | 'bottom'
  isNavbarVisible: boolean
}
const Fixed = styled.div<FixedProps>`
  position: absolute;

  ${(props) =>
    props.position === 'top' &&
    css`
      ${!props.isNavbarVisible &&
      css`
        top: 0;
      `}
      ${props.isNavbarVisible &&
      props.navigatorOptions.theme === 'Cupertino' &&
      css`
        top: 2.75rem;
      `}
      ${props.isNavbarVisible &&
      props.navigatorOptions.theme === 'Android' &&
      css`
        top: 3.5rem;
      `}
    `}

  ${(props) =>
    props.position === 'bottom' &&
    css`
      bottom: 0;
    `}
`

interface EdgeProps {
  navigatorOptions: NavigatorOptions
  isNavbarVisible: boolean
}
const Edge = styled.div<EdgeProps>`
  position: absolute;
  left: 0;
  height: 100%;
  width: 1.25rem;

  ${(props) =>
    !props.isNavbarVisible &&
    css`
      top: 0;
    `}
  ${(props) =>
    props.isNavbarVisible &&
    props.navigatorOptions.theme === 'Cupertino' &&
    css`
      top: 2.75rem;
    `}
      ${(props) =>
    props.isNavbarVisible &&
    props.navigatorOptions.theme === 'Android' &&
    css`
      top: 3.5rem;
    `}
`

interface TransitionNodeProps {
  navigatorOptions: NavigatorOptions
}
const TransitionNode = styled.div<TransitionNodeProps>`
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
        ${Dim} {
          opacity: 1;
        }
        ${Frame} {
          transform: translateX(0);
        }
      }

      &.exit-active,
      &.exit-done {
        ${Dim} {
          opacity: 0;
        }
        ${Frame} {
          transform: translateX(100%);
        }
        ${FrameOffset} {
          transform: translateX(0);
        }
        ${NavbarContainer} {
          display: none;
        }
        ${Fixed} {
          display: none;
        }
      }
    `}

  ${(props) =>
    props.navigatorOptions.theme === 'Android' &&
    css`
      &.enter-active,
      &.enter-done {
        ${Dim} {
          opacity: 1;
        }
        ${Main} {
          opacity: 1;
          transform: translateY(0);
        }
      }

      &.exit-active,
      &.exit-done {
        ${Dim} {
          opacity: 0;
        }
        ${Main} {
          opacity: 0;
          transform: translateY(10rem);
        }
      }
    `}
`

export default Card

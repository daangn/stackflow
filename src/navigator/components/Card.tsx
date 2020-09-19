import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { css } from '@emotion/core'
import styled from '@emotion/styled'

import Navbar from './Navbar'
import { useNavigatorOptions } from '../contexts'
import { NavigatorTheme } from '../../types'
import { AtomScreenInstanceOptions, AtomScreenEdge } from '../atoms'

interface CardProps {
  screenPath: string
  screenInstanceId: string
  isRoot: boolean
  isTop: boolean
  onClose: () => void
  enterActive: boolean
  enterDone: boolean
  exitActive: boolean
  exitDone: boolean
}
const Card: React.FC<CardProps> = (props) => {
  const history = useHistory()

  const navigatorOptions = useNavigatorOptions()

  const [screenInstanceOptions] = useRecoilState(AtomScreenInstanceOptions)
  const [screenEdge, setScreenEdge] = useRecoilState(AtomScreenEdge)

  const [loading, setLoading] = useState(true)

  const screenInstanceOption = screenInstanceOptions[props.screenInstanceId]

  const x = useRef<number>(0)

  const $dim = useRef<HTMLDivElement>(null)
  const $frameContainer = useRef<HTMLDivElement>(null)
  const $hiddenDims = useMemo(
    // eslint-disable-next-line
    () => document.getElementsByClassName('css-kf-card-dim_hidden') as HTMLCollectionOf<HTMLDivElement>,
    []
  )

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
    setTimeout(() => {
      setLoading(false)
    }, 0)
  }, [])

  useEffect(() => {
    let stopped = false

    if (screenEdge.startX === null) {
      requestAnimationFrame(() => {
        if ($dim.current) {
          $dim.current.style.cssText = ''
        }
        if ($frameContainer.current) {
          $frameContainer.current.style.cssText = ''
        }
        for (let i = 0; i < $hiddenDims.length; i++) {
          $hiddenDims[i].style.cssText = ''
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
                background-color: rgba(0, 0, 0, ${0.2 - (computedEdgeX / window.screen.width) * 0.2});
                transition: 0s;
              `
          }
          if ($frameContainer.current) {
            $frameContainer.current.style.cssText = `
                overflow-y: hidden;
                transform: translateX(${computedEdgeX}px); transition: transform 0s;
              `
          }
          if ($hiddenDims[$hiddenDims.length - 1]) {
            for (let i = 0; i < $hiddenDims.length; i++) {
              $hiddenDims[i].style.cssText = `
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
    <Container
      className="css-kf-card-container"
      navigatorTheme={navigatorOptions.theme}
      animationDuration={navigatorOptions.animationDuration}
      navbarVisible={!!screenInstanceOption?.navbar.visible}
      isRoot={props.isRoot}
      isTop={props.isTop}
      enterActive={props.enterActive}
      enterDone={props.enterDone}
      exitActive={props.exitActive}
      exitDone={props.exitDone}
      isLoading={loading}>
      {!!screenInstanceOption?.navbar.visible && (
        <Navbar
          screenInstanceId={props.screenInstanceId}
          theme={navigatorOptions.theme}
          isRoot={props.isRoot}
          onClose={props.onClose}
        />
      )}
      <Dim
        ref={$dim}
        navigatorTheme={navigatorOptions.theme}
        className={'css-kf-card-dim' + (!props.isTop ? ' css-kf-card-dim_hidden' : '')}
        isTop={props.isTop}
        animationDuration={navigatorOptions.animationDuration}>
        <FrameContainer
          ref={$frameContainer}
          navigatorTheme={navigatorOptions.theme}
          className="css-card-kf-frame-container"
          isRoot={props.isRoot}
          animationDuration={navigatorOptions.animationDuration}>
          <Frame>{props.children}</Frame>
          {navigatorOptions.theme === 'Cupertino' && !props.isRoot && (
            <Edge onTouchStart={onEdgeTouchStart} onTouchMove={onEdgeTouchMove} onTouchEnd={onEdgeTouchEnd} />
          )}
        </FrameContainer>
      </Dim>
    </Container>
  )
}

interface DimProps {
  navigatorTheme: NavigatorTheme
  isTop: boolean
  animationDuration: number
}
const Dim = styled.div<DimProps>`
  width: 100%;
  height: 100%;

  ${(props) =>
    props.navigatorTheme === 'Cupertino' &&
    css`
      background-color: rgba(0, 0, 0, 0);
      transition: background-color ${props.animationDuration}ms, transform ${props.animationDuration}ms;
      will-change: background-color, transform;

      ${!props.isTop &&
      css`
        transform: translateX(-5rem);
      `}
    `}
`

interface FrameContainerProps {
  navigatorTheme: NavigatorTheme
  isRoot: boolean
  animationDuration: number
}
const FrameContainer = styled.div<FrameContainerProps>`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  background-color: #fff;

  ${(props) =>
    props.navigatorTheme === 'Cupertino' &&
    css`
      transform: translateX(0);
      transition: transform ${props.animationDuration}ms;
      will-change: transform;

      ${!props.isRoot &&
      css`
        transform: translateX(100%);
      `}
    `};
`

const Frame = styled.div`
  width: 100%;
  min-height: 100%;
`

const Edge = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 1.25rem;
`

interface ContainerProps {
  navbarVisible?: boolean
  navigatorTheme: NavigatorTheme
  animationDuration: number
  isRoot: boolean
  isTop: boolean
  enterActive: boolean
  enterDone: boolean
  exitActive: boolean
  exitDone: boolean
  isLoading: boolean
}
const Container = styled.div<ContainerProps>`
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

    switch (props.navigatorTheme) {
      case 'Cupertino':
        return css`
          padding-top: 2.75rem;
        `
      case 'Android':
      case 'Web':
        return css`
          padding-top: 3.5rem;
        `
    }
  }}

  ${(props) =>
    props.navigatorTheme === 'Cupertino' &&
    css`
      ${(props.enterActive || props.enterDone) &&
      css`
        .css-kf-card-dim {
          background-color: rgba(0, 0, 0, 0.2);
        }
        .css-card-kf-frame-container {
          transform: translateX(0);
        }
      `}
      ${(props.exitActive || props.exitDone) &&
      css`
        .css-kf-card-dim {
          background-color: rgba(0, 0, 0, 0);
          transform: translateX(0);
        }
        .css-card-kf-frame-container {
          transform: translateX(100%);
        }
        .css-kf-navbar-container {
          display: none;
        }
      `}
    `}

  ${(props) =>
    (props.navigatorTheme === 'Android' || props.navigatorTheme === 'Web') &&
    css`
      opacity: 0;
      transform: translateY(10rem);
      transition: transform ${props.animationDuration}ms, opacity ${props.animationDuration}ms;
      transition-timing-function: cubic-bezier(0.22, 0.67, 0.39, 0.83);
      will-change: transform, opacity;

      ${props.isRoot &&
      css`
        opacity: 1;
        transform: translateY(0);
      `}

      ${(props.enterActive || props.enterDone) &&
      css`
        opacity: 1;
        transform: translateY(0);
      `}

      ${!props.isTop &&
      css`
        transform: translateY(-2rem);
        transition-timing-function: cubic-bezier(0.29, 0.55, 0.36, 0.69);
      `}

      ${(props.exitActive || props.exitActive) &&
      css`
        opacity: 0;
        transform: translateY(10rem);
      `}
    `}

  ${(props) =>
    props.isLoading &&
    css`
      display: none;
    `}
`

export default Card

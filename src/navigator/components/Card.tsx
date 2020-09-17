import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { css } from '@emotion/core'
import styled from '@emotion/styled'

import Navbar from './Navbar'
import { useNavigatorOptions } from '../contexts'
import { Environment } from '../../types'
import { AtomScreenInstanceOptions, AtomScreenEdge } from '../atoms'

// 한번에 하나의 touchmove만 가능하다고 판단해서, 전역변수로 설정 (렌더링 중 유실 방지)
let tempLastX: number | null = null

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

  const $dim = useRef<HTMLDivElement>(null)
  const $frameContainer = useRef<HTMLDivElement>(null)

  const $hiddenDims = useMemo(
    // eslint-disable-next-line
    () => document.getElementsByClassName('kf-dim_hidden') as HTMLCollectionOf<HTMLDivElement>,
    []
  )

  const onEdgeTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      setScreenEdge({
        startX: e.touches[0].clientX,
        startTime: Date.now(),
      })
    },
    [screenEdge]
  )

  const onEdgeTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (screenEdge.startX) {
        const computedEdgeX = e.touches[0].clientX - screenEdge.startX

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
          if ($hiddenDims[$hiddenDims.length - 1])
            for (let i = 0; i < $hiddenDims.length; i++) {
              $hiddenDims[i].style.cssText = `
              transform: translateX(-${5 - (5 * computedEdgeX) / window.screen.width}rem);
              transition: 0s;
            `
            }
        }
        tempLastX = e.touches[0].clientX
      }
    },
    [screenEdge]
  )

  const onEdgeTouchEnd = useCallback(() => {
    if (tempLastX) {
      const velocity = tempLastX / (Date.now() - (screenEdge.startTime as number))

      if (velocity > 1 || tempLastX / window.screen.width > 0.4) {
        history.goBack()
      }

      setScreenEdge({
        startX: null,
        startTime: null,
      })
      tempLastX = null

      if ($dim.current) {
        $dim.current.style.cssText = ''
      }
      if ($frameContainer.current) {
        $frameContainer.current.style.cssText = ''
      }
      for (let i = 0; i < $hiddenDims.length; i++) {
        $hiddenDims[i].style.cssText = ''
      }
    }
  }, [screenEdge])

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 0)
  }, [])

  return (
    <Container
      environment={navigatorOptions.environment}
      navbarVisible={!!screenInstanceOption?.navbar.visible}
      enterActive={props.enterActive}
      enterDone={props.enterDone}
      exitActive={props.exitActive}
      exitDone={props.exitDone}
      isLoading={loading}>
      {!!screenInstanceOption?.navbar.visible && (
        <Navbar
          screenInstanceId={props.screenInstanceId}
          environment={navigatorOptions.environment}
          isRoot={props.isRoot}
          onClose={props.onClose}
        />
      )}
      <Dim
        ref={$dim}
        className={'kf-dim' + (!props.isTop ? ' kf-dim_hidden' : '')}
        isTop={props.isTop}
        animationDuration={navigatorOptions.animationDuration}>
        <FrameContainer
          ref={$frameContainer}
          className="kf-frame-container"
          isRoot={props.isRoot}
          animationDuration={navigatorOptions.animationDuration}>
          <Frame>{props.children}</Frame>
          {!props.isRoot && (
            <Edge onTouchStart={onEdgeTouchStart} onTouchMove={onEdgeTouchMove} onTouchEnd={onEdgeTouchEnd} />
          )}
        </FrameContainer>
      </Dim>
    </Container>
  )
}

interface DimProps {
  isTop: boolean
  animationDuration: number
}
const Dim = styled.div<DimProps>`
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  transform: translateX(-5rem);
  transition: background-color ${(props) => props.animationDuration}ms,
    transform ${(props) => props.animationDuration}ms;

  ${(props) =>
    props.isTop &&
    css`
      transform: translateX(0);
    `}
`

interface FrameContainerProps {
  isRoot: boolean
  animationDuration: number
}
const FrameContainer = styled.div<FrameContainerProps>`
  width: 100%;
  height: 100%;
  transition: transform ${(props) => props.animationDuration}ms;
  transform: translateX(0);
  overflow-y: scroll;
  background-color: #fff;

  ${(props) =>
    !props.isRoot &&
    css`
      transform: translateX(100%);
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
  environment: Environment
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

    switch (props.environment) {
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
    (props.enterActive || props.enterDone) &&
    css`
      .kf-dim {
        background-color: rgba(0, 0, 0, 0.2);
      }
      .kf-frame-container {
        transform: translateX(0);
      }
    `}

  ${(props) =>
    (props.exitActive || props.exitDone) &&
    css`
      .kf-dim {
        background-color: rgba(0, 0, 0, 0);
        transform: translateX(0);
      }
      .kf-frame-container {
        transform: translateX(100%);
      }
      .kf-navbar-container {
        display: none;
      }
    `}

  ${(props) =>
    props.isLoading &&
    css`
      display: none;
    `}
`

export default Card

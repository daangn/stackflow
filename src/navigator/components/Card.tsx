import React, { useEffect, useRef, useState } from 'react'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import Navbar from './Navbar'
import { useNavigatorOptions } from '../contexts'
import { Environment } from '../../types'
import { useRecoilState } from 'recoil'
import { useHistory } from 'react-router-dom'
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

  const $dim = useRef<HTMLDivElement>(null)
  const $frameContainer = useRef<HTMLDivElement>(null)

  const onEdgeTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setScreenEdge({
      ...screenEdge,
      startX: e.touches[0].clientX,
      startTime: Date.now(),
    })
  }

  const onEdgeTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (screenEdge.startX) {
      const computedEdgeX = e.touches[0].clientX - screenEdge.startX
      if (computedEdgeX >= 0) {
        setScreenEdge({
          ...screenEdge,
          x: computedEdgeX,
        })
      } else {
        setScreenEdge({
          ...screenEdge,
          x: 0,
        })
      }
    }
  }

  const onEdgeTouchEnd = () => {
    const velocity = screenEdge.x / (Date.now() - (screenEdge.startTime as number))

    if (velocity > 1 || screenEdge.x / window.screen.width > 0.4) {
      history.goBack()
    }

    setScreenEdge({
      x: 0,
      startX: null,
      startTime: null,
    })
  }

  useEffect(() => {
    let stopped = false

    if (screenEdge.startX !== null) {
      animate()
    }

    function animate() {
      requestAnimationFrame(() => {
        if ($dim.current) {
          if (props.isTop) {
            $dim.current.style.backgroundColor = `rgba(0, 0, 0, ${0.2 - (screenEdge.x / window.screen.width) * 0.2})`
          }
          if (!props.isTop) {
            $dim.current.style.transform = `translateX(-${2 - (2 * screenEdge.x) / window.screen.width}rem)`
          }
          $dim.current.style.transition = '0s'
        }
        if ($frameContainer.current) {
          $frameContainer.current.style.overflowY = 'hidden'
          if (props.isTop) {
            $frameContainer.current.style.transform = `translateX(${screenEdge.x}px)`
            $frameContainer.current.style.transition = 'transform 0s'
          }
        }

        if (stopped) {
          if ($dim.current) {
            $dim.current.style.backgroundColor = ''
            $dim.current.style.transform = ''
            $dim.current.style.transition = ''
          }
          if ($frameContainer.current) {
            $frameContainer.current.style.overflowY = ''
            $frameContainer.current.style.transform = ''
            $frameContainer.current.style.transition = ''
          }

        } else {
          animate()
        }
      })
    }

    return () => {
      stopped = true
    }
  }, [props.isTop, screenEdge])

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
      isLoading={loading}
    >
      {!!screenInstanceOption?.navbar.visible &&
        <Navbar
          screenInstanceId={props.screenInstanceId}
          environment={navigatorOptions.environment}
          isRoot={props.isRoot}
          onClose={props.onClose}
        />
      }
      <Dim
        ref={$dim}
        className='kf-dim'
        isTop={props.isTop}
        animationDuration={navigatorOptions.animationDuration}
      >
        <FrameContainer
          ref={$frameContainer}
          className='kf-frame-container'
          isRoot={props.isRoot}
          animationDuration={navigatorOptions.animationDuration}
        >
          <Frame>
            {props.children}
          </Frame>
          {!props.isRoot &&
            <Edge
              onTouchStart={onEdgeTouchStart}
              onTouchMove={onEdgeTouchMove}
              onTouchEnd={onEdgeTouchEnd}
            />
          }
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
  transform: translateX(-2rem);
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
  navbarVisible?: boolean,
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
      return css``
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

  ${(props) => (props.enterActive || props.enterDone) && css`
    .kf-dim {
      background-color: rgba(0, 0, 0, 0.2);
    }
    .kf-frame-container {
      transform: translateX(0);
    }
  `}

  ${(props) => (props.exitActive || props.exitDone) && css`
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

  ${(props) => props.isLoading && css`
    display: none;
  `}
`

export default Card

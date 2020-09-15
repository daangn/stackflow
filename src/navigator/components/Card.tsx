import React from 'react'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import Navbar from './Navbar'
import { useNavigatorContext } from '../contexts/NavigatorContext'
import { Environment } from '../../types'

interface CardProps {
  screenInstanceId: string
  isNavbar: boolean
  isRoot: boolean
  isTop: boolean
  isUnderTop: boolean
  onClose: () => void
}
const Card: React.FC<CardProps> = (props) => {
  const navigator = useNavigatorContext()

  return (
    <Container
      environment={navigator.environment}
      isNavbar={props.isNavbar}
    >
      {props.isNavbar &&
        <Navbar
          screenInstanceId={props.screenInstanceId}
          environment={navigator.environment}
          isRoot={props.isRoot}
          onClose={props.onClose}
        />
      }
      <Dim
        className='kf-dim'
        isTop={props.isTop}
        animationDuration={navigator.animationDuration}
      >
        <FrameContainer
          className='kf-frame-container'
          isRoot={props.isRoot}
          animationDuration={navigator.animationDuration}
        >
          <Frame>
            {props.children}
          </Frame>
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

  ${(props) =>
    !props.isRoot &&
    css`
      transform: translateX(100%);
    `};
`

const Frame = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  background-color: #fff;
`

interface ContainerProps {
  isNavbar?: boolean,
  environment: Environment
}
const Container = styled.div<ContainerProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  
  ${(props) => {
    if (!props.isNavbar) {
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

  &.enter-active, &.enter-done {
    .kf-dim {
      background-color: rgba(0, 0, 0, 0.2);
    }
    .kf-frame-container {
      transform: translateX(0);
    }
    .kf-navbar-container {
      opacity: 1;
    }
  }
  &.exit-active {
    .kf-dim {
      background-color: rgba(0, 0, 0, 0);
    }
    .kf-frame-container {
      transform: translateX(100%);
    }
    .kf-navbar-container {
      opacity: 0;
    }
  }
`

export default Card

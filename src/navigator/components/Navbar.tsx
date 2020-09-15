import React from 'react'
import { useHistory } from 'react-router-dom'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import IconBack from '../assets/IconBack'
import IconClose from '../assets/IconClose'
import { Environment } from '../../types'
import { useNavigatorContext } from '../contexts/NavigatorContext'
import { useRecoilState } from 'recoil'
import { AtomScreenInstances } from '../atoms/ScreenInstances'

interface NavbarProps {
  screenInstanceId: string
  environment: Environment
  isRoot: boolean
  onClose: () => void
}
const Navbar: React.FC<NavbarProps> = (props) => {
  const history = useHistory()
  const navigator = useNavigatorContext()

  const [screenInstances] = useRecoilState(AtomScreenInstances)
  const screenInstance = screenInstances.find((instance) => instance.id === props.screenInstanceId)

  const onBackClick = () => {
    history.goBack()
  }

  return (
    <Container
      className='kf-navbar-container'
      environment={props.environment}
      animationDuration={navigator.animationDuration}
    >
      {props.environment === 'Cupertino' &&
        <Center environment={props.environment}>{screenInstance?.navbar.title}</Center>
      }
      <Buttons>
        {!props.isRoot &&
          <Left>
            <Back onClick={onBackClick}>
              <IconBack />
            </Back>
          </Left>
        }
        {(props.environment === 'Android' || props.environment === 'Web') &&
          <Center environment={props.environment}>{screenInstance?.navbar.title}</Center>
        }
        <Right>
          {props.isRoot &&
            <Close onClick={props.onClose}>
              <IconClose />
            </Close>
          }
        </Right>
      </Buttons>
    </Container>
  )
}

export const Container = styled.div<{ environment: Environment, animationDuration: number }>`
  background-color: #fff;
  display: flex;
  position: absolute;
  width: 100%;
  top: 0;

  ${(props) => {
    switch (props.environment) {
      case 'Cupertino':
        return css`
          height: 2.75rem;
          box-shadow: inset 0px -0.5px 0 rgb(177, 178, 179);
        `
      case 'Android':
      case 'Web':
        return css`
          height: 3.5rem;
          box-shadow: inset 0px -1px 0 rgba(0, 0, 0, 0.07);
        `
    }
  }}
`

const Buttons = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const Left = styled.div`
  padding: 0 0.875rem;
  display: flex;
  align-items: center;
  height: 100%;
`

const Back = styled.div`
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  display: flex;
  opacity: 1;
  transition: opacity 300ms;

  &:active {
    opacity: 0.2;
    transition: opacity 0s;
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`

const Center = styled.div<{ environment: Environment }>`
  flex: 1;
  display: flex;
  align-items: center;
  font-weight: bold;

  ${(props) => {
    switch (props.environment) {
      case 'Android':
      case 'Web':
        return css`
          font-family: 'Noto Sans KR', sans-serif;
          justify-content: flex-start;
          padding-left: 0.875rem;
          font-size: 1.1875rem;
        `
      case 'Cupertino':
        return css`
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont;
          font-weight: 600;
          font-size: 1rem;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        `
    }
  }}
`

const Right = styled.div`
  padding: 0 0.875rem;
  display: flex;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
`

const Close = styled.div`
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  display: flex;
  opacity: 1;
  transition: opacity 300ms;

  &:active {
    opacity: 0.2;
    transition: opacity 0s;
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`

export default Navbar
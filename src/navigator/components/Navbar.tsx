import React from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { css } from '@emotion/core'
import styled from '@emotion/styled'

import { IconBack, IconClose } from '../assets'
import { AtomScreenInstanceOptions } from '../atoms'
import { useNavigatorOptions } from '../contexts'
import { NavigatorTheme } from '../../types'

interface NavbarProps {
  screenInstanceId: string
  theme: NavigatorTheme
  isRoot: boolean
  onClose: () => void
}
const Navbar: React.FC<NavbarProps> = (props) => {
  const history = useHistory()
  const navigatorOptions = useNavigatorOptions()

  const [screenInstanceOptions] = useRecoilState(AtomScreenInstanceOptions)

  const screenInstanceOption = screenInstanceOptions[props.screenInstanceId]

  return (
    <Container
      className="css-nb-container"
      navigatorTheme={props.theme}
      animationDuration={navigatorOptions.animationDuration}>
      {props.theme === 'Cupertino' && (
        <Center navigatorTheme={props.theme}>{screenInstanceOption?.navbar.title}</Center>
      )}
      <Flex>
        {(!props.isRoot || screenInstanceOption?.navbar.appendLeft) && (
          <Left>
            {!props.isRoot &&
              (screenInstanceOption?.navbar.customBackButton ? (
                <div onClick={history.goBack}>{screenInstanceOption.navbar.customBackButton}</div>
              ) : (
                <Back onClick={history.goBack}>
                  <IconBack />
                </Back>
              ))}
            {screenInstanceOption?.navbar.appendLeft}
          </Left>
        )}
        {props.theme === 'Android' && (
          <Center navigatorTheme={props.theme}>{screenInstanceOption?.navbar.title}</Center>
        )}
        {(props.isRoot || screenInstanceOption?.navbar.appendRight) && (
          <Right>
            {screenInstanceOption?.navbar.appendRight}
            {props.isRoot &&
              (screenInstanceOption.navbar.customCloseButton ? (
                <div onClick={props.onClose}>{screenInstanceOption.navbar.customCloseButton}</div>
              ) : (
                <Close onClick={props.onClose}>
                  <IconClose />
                </Close>
              ))}
          </Right>
        )}
      </Flex>
    </Container>
  )
}

interface ContainerProps {
  navigatorTheme: NavigatorTheme
  animationDuration: number
}
export const Container = styled.div<ContainerProps>`
  background-color: #fff;
  display: flex;
  position: absolute;
  width: 100%;
  top: 0;

  ${(props) => {
    switch (props.navigatorTheme) {
      case 'Cupertino':
        return css`
          height: 2.75rem;
          box-shadow: inset 0px -0.5px 0 rgba(0, 0, 0, 0.12);
        `
      case 'Android':
        return css`
          height: 3.5rem;
          box-shadow: inset 0px -1px 0 rgba(0, 0, 0, 0.07);
        `
    }
  }}
`

const Flex = styled.div`
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

const Center = styled.div<{ navigatorTheme: NavigatorTheme }>`
  flex: 1;
  display: flex;
  align-items: center;
  font-weight: bold;

  ${(props) => {
    switch (props.navigatorTheme) {
      case 'Android':
        return css`
          font-family: 'Noto Sans KR', sans-serif;
          justify-content: flex-start;
          padding-left: 0.75rem;
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

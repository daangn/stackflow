import React, { useMemo, ReactNode, useCallback, MouseEvent } from 'react'
import styled from '@emotion/styled'

import { useRoute } from '../../context/route'
import Close from '../icons/Close'
import Back from '../icons/Back'
import { useHistory } from '../../context/history'
import { useSwiper } from '../../context/swiper'

export interface HeaderProps {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  title: string | JSX.Element
  onClickLeftIcon?: (e: MouseEvent<HTMLButtonElement>) => void
}

const Header: React.FC<HeaderProps> = ({ leftIcon, rightIcon, title, onClickLeftIcon }) => {
  const { currentIndex } = useRoute()
  const history = useHistory()
  const { onLastPagePop } = useSwiper()

  const isAndroid = useMemo(() => !!(window as any).AndroidFunction, [])
  const isLastPage = useMemo(() => currentIndex < 1, [currentIndex])

  const handleClickBackButton = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (onClickLeftIcon) {
        return onClickLeftIcon(e)
      }

      isLastPage ? onLastPagePop?.() : history.back()
    },
    [history, onLastPagePop, isLastPage, onClickLeftIcon]
  )

  return (
    <Base isAndroid={isAndroid}>
      <Title isAndroid={isAndroid}>{title}</Title>
      <IconArea>
        <div>
          {leftIcon || <IconButton onClick={handleClickBackButton}>{isLastPage ? <Close /> : <Back />}</IconButton>}
        </div>
        {rightIcon && <div>{rightIcon}</div>}
      </IconArea>
    </Base>
  )
}

const Base = styled.header<{ isAndroid: boolean }>`
  height: 56px;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: ${({ isAndroid }) => (isAndroid ? '0px 1px 3px rgba(0, 0, 0, 0.07)' : '0px 1px 0px #E9ECEF')};
  display: flex;
  align-items: center;
`
const IconArea = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  padding: 0 8px;
`
const IconButton = styled.button`
  -webkit-tap-highlight-color: transparent;
  outline: none;
  background: none;
  border: none;
  padding: 0 8px;
  display: block;

  svg {
    display: block;
  }
`
const Title = styled.h1<{ isAndroid: boolean }>`
  margin: 0;
  pointer-events: none;
  font-weight: bold;
  font-size: 19px;
  line-height: 24px;
  letter-spacing: -0.03em;
  color: #212529;
  flex: 1;
  padding: 0 56px;
  text-align: ${({ isAndroid }) => (isAndroid ? 'left' : 'center')};
  box-sizing: border-box;
`

export default Header

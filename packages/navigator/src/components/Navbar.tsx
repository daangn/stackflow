import React, { useLayoutEffect, useRef, useState } from 'react'

import { IconBack, IconClose } from '../assets'
import { useNavigatorOptions } from '../contexts'
import { NavigatorTheme } from '../helpers'
import { useStoreSelector } from '../store'
import { useNavigator } from '../useNavigator'
import {
  navbar,
  navbarBack,
  navbarCenter,
  navbarCenterMain,
  navbarCenterMainEdge,
  navbarCenterMainText,
  navbarClose,
  navbarFlex,
  navbarLeft,
  navbarMain,
  navbarRight,
  navbarSvgIcon,
} from './Navbar.css'

interface NavbarProps {
  screenInstanceId: string
  theme: NavigatorTheme
  isRoot: boolean
  isPresent: boolean
  onTopClick: () => void
  onClose?: () => void
}
const Navbar: React.FC<NavbarProps> = (props) => {
  const { pop } = useNavigator()
  const navigatorOptions = useNavigatorOptions()

  const android = navigatorOptions.theme === 'Android'
  const cupertino = navigatorOptions.theme === 'Cupertino'

  const screenInstanceOptions = useStoreSelector(
    (state) => state.screenInstanceOptions
  )

  const [centerMainWidth, setCenterMainWidth] = useState<string | undefined>(
    undefined
  )

  const navbarRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)

  const screenInstanceOption = screenInstanceOptions[props.screenInstanceId]

  useLayoutEffect(() => {
    const onResize = () => {
      if (!navbarRef.current || !centerRef.current) {
        return
      }

      const screenWidth = navbarRef.current.clientWidth

      const { offsetLeft: leftWidth, clientWidth: centerWidth } =
        centerRef.current
      const rightWidth = screenWidth - leftWidth - centerWidth

      const sideMargin = Math.max(leftWidth, rightWidth)

      setCenterMainWidth(screenWidth - 2 * sideMargin + 'px')
    }

    if (props.theme === 'Cupertino') {
      onResize()
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
      }
    }
  }, [screenInstanceOption])

  const onBackClick = () => {
    pop()
  }

  const closeButton =
    props.onClose &&
    props.isRoot &&
    (screenInstanceOption?.navbar.customCloseButton ? (
      <a
        role="text"
        aria-label="닫기"
        className={navbarClose}
        onClick={props.onClose}
      >
        {screenInstanceOption.navbar.customCloseButton}
      </a>
    ) : (
      <a
        role="text"
        aria-label="닫기"
        className={navbarClose}
        onClick={props.onClose}
      >
        <IconClose className={navbarSvgIcon} />
      </a>
    ))

  const backButton =
    !props.isRoot &&
    (screenInstanceOption?.navbar.customBackButton ? (
      <a
        role="text"
        aria-label="뒤로가기"
        className={navbarBack}
        onClick={onBackClick}
      >
        {screenInstanceOption.navbar.customBackButton}
      </a>
    ) : (
      <a
        role="text"
        aria-label="뒤로가기"
        className={navbarBack}
        onClick={onBackClick}
      >
        {navigatorOptions.theme === 'Cupertino' && props.isPresent ? (
          <IconClose className={navbarSvgIcon} />
        ) : (
          <IconBack className={navbarSvgIcon} />
        )}
      </a>
    ))

  const isLeft = !!(
    (screenInstanceOption?.navbar.closeButtonLocation === 'left' &&
      closeButton) ||
    backButton ||
    screenInstanceOption?.navbar.appendLeft
  )

  const noBorder = screenInstanceOption?.navbar.noBorder

  return (
    <div
      ref={navbarRef}
      className={navbar({
        cupertinoAndIsNotPresent: cupertino && !props.isPresent,
      })}
    >
      <div
        className={navbarMain({
          android,
          cupertino,
          noBorder,
        })}
      >
        <div className={navbarFlex}>
          <div className={navbarLeft}>
            {screenInstanceOption?.navbar.closeButtonLocation === 'left' &&
              closeButton}
            {backButton}
            {screenInstanceOption?.navbar.appendLeft}
          </div>
          <div
            ref={centerRef}
            className={navbarCenter({
              android,
            })}
          >
            <div
              className={navbarCenterMain({
                android,
                androidAndIsLeft: android && isLeft,
                cupertino,
              })}
              style={{
                width: centerMainWidth,
              }}
            >
              {typeof screenInstanceOption?.navbar.title === 'string' ? (
                <div className={navbarCenterMainText}>
                  {screenInstanceOption?.navbar.title}
                </div>
              ) : (
                screenInstanceOption?.navbar.title
              )}
            </div>
            <div
              className={navbarCenterMainEdge({
                cupertino,
              })}
              style={{
                width: centerMainWidth,
              }}
              onClick={props.onTopClick}
            />
          </div>
          <div
            className={navbarRight({
              android,
            })}
          >
            {screenInstanceOption?.navbar.appendRight}
            {screenInstanceOption?.navbar.closeButtonLocation === 'right' &&
              closeButton}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar

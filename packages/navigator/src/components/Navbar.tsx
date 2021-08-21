import React, { useLayoutEffect, useRef, useState } from 'react'

import { IconBack, IconClose } from '../assets'
import { useNavigatorOptions } from '../contexts'
import { NavigatorTheme } from '../helpers'
import { useStoreSelector } from '../store'
import { useNavigator } from '../useNavigator'
import * as css from './Navbar.css'

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
        className={css.closeButton}
        role="text"
        aria-label="닫기"
        onClick={props.onClose}
      >
        {screenInstanceOption.navbar.customCloseButton}
      </a>
    ) : (
      <a
        className={css.closeButton}
        role="text"
        aria-label="닫기"
        onClick={props.onClose}
      >
        <IconClose className={css.svgIcon} />
      </a>
    ))

  const backButton =
    !props.isRoot &&
    (screenInstanceOption?.navbar.customBackButton ? (
      <a
        className={css.backButton}
        role="text"
        aria-label="뒤로가기"
        onClick={onBackClick}
      >
        {screenInstanceOption.navbar.customBackButton}
      </a>
    ) : (
      <a
        className={css.backButton}
        role="text"
        aria-label="뒤로가기"
        onClick={onBackClick}
      >
        {navigatorOptions.theme === 'Cupertino' && props.isPresent ? (
          <IconClose className={css.svgIcon} />
        ) : (
          <IconBack className={css.svgIcon} />
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
      className={css.container({
        cupertinoAndIsNotPresent: cupertino && !props.isPresent,
      })}
      ref={navbarRef}
    >
      <div
        className={css.main({
          android,
          cupertino,
          noBorder,
        })}
      >
        <div className={css.flex}>
          <div className={css.left}>
            {screenInstanceOption?.navbar.closeButtonLocation === 'left' &&
              closeButton}
            {backButton}
            {screenInstanceOption?.navbar.appendLeft}
          </div>
          <div
            className={css.center({
              android,
            })}
            ref={centerRef}
          >
            <div
              className={css.centerMain({
                android,
                androidAndIsLeft: android && isLeft,
                cupertino,
              })}
              style={{
                width: centerMainWidth,
              }}
            >
              {typeof screenInstanceOption?.navbar.title === 'string' ? (
                <div className={css.centerMainText}>
                  {screenInstanceOption?.navbar.title}
                </div>
              ) : (
                screenInstanceOption?.navbar.title
              )}
            </div>
            <div
              className={css.centerMainEdge({
                cupertino,
              })}
              style={{
                width: centerMainWidth,
              }}
              onClick={props.onTopClick}
            />
          </div>
          <div
            className={css.right({
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

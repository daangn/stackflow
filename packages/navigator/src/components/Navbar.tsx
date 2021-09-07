import React, { useEffect, useRef, useState } from 'react'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import { IconBack, IconClose } from '../assets'
import { useStoreSelector } from '../store'
import { INavigatorTheme } from '../types'
import { useNavigator } from '../useNavigator'
import * as css from './Navbar.css'

interface INavbarProps {
  screenInstanceId: string
  theme: INavigatorTheme
  isRoot: boolean
  isPresent: boolean
  backButtonAriaLabel: string
  closeButtonAriaLabel: string
  onTopClick: () => void
  onClose?: () => void
}
const Navbar: React.FC<INavbarProps> = (props) => {
  const { pop } = useNavigator()

  const android = props.theme === 'Android'
  const cupertino = props.theme === 'Cupertino'

  const screenInstanceOptions = useStoreSelector(
    (state) => state.screenInstanceOptions
  )

  const [centerMainWidth, setCenterMainWidth] = useState<number | undefined>(
    undefined
  )

  const navbarRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)

  const screenInstanceOption = screenInstanceOptions[props.screenInstanceId]

  useEffect(() => {
    const $navbar = navbarRef.current
    const $center = centerRef.current

    const onResize = () => {
      if (!$navbar || !$center) {
        return
      }

      const screenWidth = $navbar.clientWidth

      const leftWidth = $center.offsetLeft
      const centerWidth = $center.clientWidth
      const rightWidth = screenWidth - leftWidth - centerWidth

      const sideMargin = Math.max(leftWidth, rightWidth)

      setCenterMainWidth(screenWidth - 2 * sideMargin)
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
        aria-label={props.closeButtonAriaLabel}
        onClick={props.onClose}
      >
        {screenInstanceOption.navbar.customCloseButton}
      </a>
    ) : (
      <a
        className={css.closeButton}
        role="text"
        aria-label={props.closeButtonAriaLabel}
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
        aria-label={props.backButtonAriaLabel}
        onClick={onBackClick}
      >
        {screenInstanceOption.navbar.customBackButton}
      </a>
    ) : (
      <a
        className={css.backButton}
        role="text"
        aria-label={props.backButtonAriaLabel}
        onClick={onBackClick}
      >
        {props.theme === 'Cupertino' && props.isPresent ? (
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
      style={assignInlineVars({
        [css.navbarVars.centerMainWidth]: `${centerMainWidth}px`,
      })}
    >
      <div
        className={css.main({
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

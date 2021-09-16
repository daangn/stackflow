import React, { useEffect, useRef, useState } from 'react'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import { IconBack, IconClose } from '../assets'
import { vars } from '../Navigator.css'
import { INavigatorTheme } from '../types'
import { useNavigator } from '../useNavigator'
import * as css from './Navbar.css'
import { useScreenHelmet } from './Stack.ScreenHelmetContext'

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
  const { screenHelmetOption } = useScreenHelmet()

  const android = props.theme === 'Android'
  const cupertino = props.theme === 'Cupertino'

  const [centerMainWidth, setCenterMainWidth] = useState<number | undefined>(
    undefined
  )

  const navbarRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)

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
  }, [screenHelmetOption])

  const onBackClick = () => {
    pop()
  }

  const closeButton =
    props.onClose &&
    props.isRoot &&
    (screenHelmetOption.customCloseButton ? (
      <a
        className={css.closeButton}
        role="text"
        aria-label={props.closeButtonAriaLabel}
        onClick={props.onClose}
      >
        {screenHelmetOption.customCloseButton}
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
    (screenHelmetOption.customBackButton ? (
      <a
        className={css.backButton}
        role="text"
        aria-label={props.backButtonAriaLabel}
        onClick={onBackClick}
      >
        {screenHelmetOption.customBackButton}
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
    (screenHelmetOption.closeButtonLocation === 'left' && closeButton) ||
    backButton ||
    screenHelmetOption.appendLeft
  )

  const noBorder = screenHelmetOption.noBorder

  return (
    <div
      className={css.container({
        cupertinoAndIsNotPresent:
          cupertino && !props.isPresent ? true : undefined,
      })}
      ref={navbarRef}
      style={assignInlineVars({
        [vars.navbar.center.mainWidth]: `${centerMainWidth}px`,
      })}
    >
      <div
        className={css.main({
          noBorder: noBorder ? true : undefined,
        })}
      >
        <div className={css.flex}>
          <div className={css.left}>
            {screenHelmetOption.closeButtonLocation === 'left' && closeButton}
            {backButton}
            {screenHelmetOption.appendLeft}
          </div>
          <div
            className={css.center({
              android: android ? true : undefined,
            })}
            ref={centerRef}
          >
            <div
              className={css.centerMain({
                android: android ? true : undefined,
                androidAndIsLeft: android && isLeft ? true : undefined,
                cupertino: cupertino ? true : undefined,
              })}
            >
              {typeof screenHelmetOption.title === 'string' ? (
                <div className={css.centerMainText}>
                  {screenHelmetOption.title}
                </div>
              ) : (
                screenHelmetOption.title
              )}
            </div>
            <div
              className={css.centerMainEdge({
                cupertino: cupertino ? true : undefined,
              })}
              onClick={props.onTopClick}
            />
          </div>
          <div
            className={css.right({
              android: android ? true : undefined,
            })}
          >
            {screenHelmetOption.appendRight}
            {screenHelmetOption.closeButtonLocation === 'right' && closeButton}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar

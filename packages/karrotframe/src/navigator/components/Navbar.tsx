import classnames from 'classnames'
import { Observer } from 'mobx-react-lite'
import React, { useEffect, useRef } from 'react'

import { NavigatorTheme } from '../../types'
import { IconBack, IconClose } from '../assets'
import { useNavigatorOptions } from '../contexts'
import styles from './Navbar.scss'
import store from '../store'
import { useNavigator } from '../useNavigator'

interface NavbarProps {
  screenInstanceId: string
  theme: NavigatorTheme
  isRoot: boolean
  isPresent: boolean
  onClose?: () => void
}
const Navbar: React.FC<NavbarProps> = (props) => {
  const { pop } = useNavigator()
  const navigatorOptions = useNavigatorOptions()
  const centerRef = useRef<HTMLDivElement>(null)
  const centerTextRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () => {
      if (!centerRef.current) {
        return
      }

      const screenWidth = window.innerWidth

      const {
        offsetLeft: leftWidth,
        clientWidth: centerWidth,
      } = centerRef.current
      const rightWidth = screenWidth - leftWidth - centerWidth

      const margin = Math.max(leftWidth, rightWidth)

      if (centerTextRef.current) {
        centerTextRef.current.style.maxWidth = screenWidth - 2 * margin + 'px'
      }
    }

    if (props.theme === 'Cupertino') {
      onResize()
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
      }
    }
  }, [])

  const onBackClick = () => {
    pop()
  }

  return (
    <Observer>
      {() => {
        const screenInstanceOption = store.screenInstanceOptions.get(
          props.screenInstanceId
        )
        const closeButton =
          props.onClose &&
          props.isRoot &&
          (screenInstanceOption?.navbar.customCloseButton ? (
            <div className={styles.navbarClose} onClick={props.onClose}>
              {screenInstanceOption.navbar.customCloseButton}
            </div>
          ) : (
            <div className={styles.navbarClose} onClick={props.onClose}>
              <IconClose />
            </div>
          ))

        const backButton =
          !props.isRoot &&
          (screenInstanceOption?.navbar.customBackButton ? (
            <div className={styles.navbarBack} onClick={onBackClick}>
              {screenInstanceOption.navbar.customBackButton}
            </div>
          ) : (
            <div className={styles.navbarBack} onClick={onBackClick}>
              {navigatorOptions.theme === 'Cupertino' && props.isPresent ? (
                <IconClose />
              ) : (
                <IconBack />
              )}
            </div>
          ))

        const isLeft = !!(
          (screenInstanceOption?.navbar.closeButtonLocation === 'left' &&
            closeButton) ||
          backButton ||
          screenInstanceOption?.navbar.appendLeft
        )

        return (
          <div className={styles.navbarContainer}>
            <div className={styles.navbarMain}>
              <div className={styles.navbarFlex}>
                <div className={styles.navbarLeft}>
                  {screenInstanceOption?.navbar.closeButtonLocation ===
                    'left' && closeButton}
                  {backButton}
                  {screenInstanceOption?.navbar.appendLeft}
                </div>
                <div className={styles.navbarCenter} ref={centerRef}>
                  <div
                    className={classnames(styles.navbarCenterMain, {
                      [styles.isLeft]: isLeft,
                    })}
                  >
                    {typeof screenInstanceOption?.navbar.title === 'string' ? (
                      <div
                        ref={centerTextRef}
                        className={styles.navbarCenterMainText}
                      >
                        {screenInstanceOption?.navbar.title}
                      </div>
                    ) : (
                      screenInstanceOption?.navbar.title
                    )}
                  </div>
                </div>
                <div className={styles.navbarRight}>
                  {screenInstanceOption?.navbar.appendRight}
                  {screenInstanceOption?.navbar.closeButtonLocation ===
                    'right' && closeButton}
                </div>
              </div>
            </div>
          </div>
        )
      }}
    </Observer>
  )
}

export default Navbar

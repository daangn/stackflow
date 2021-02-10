import classnames from 'classnames'
import { Observer } from 'mobx-react-lite'
import React, { CSSProperties, useEffect, useRef, useState } from 'react'

import { NavigatorTheme } from '../../types'
import { IconBack, IconClose } from '../assets'
import { useNavigatorOptions } from '../contexts'
import styles from '../index.css'
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
  const [centerTextStyle, setCenterTextStyle] = useState<CSSProperties>({})

  useEffect(() => {
    if (props.theme === 'Cupertino') {
      let currentClientWidth = 0
      let animationFrameId: number

      const detectMaxWidth = () => {
        animationFrameId = requestAnimationFrame(() => {
          const clientWidth = centerRef.current?.clientWidth
          if (clientWidth && clientWidth !== currentClientWidth) {
            currentClientWidth = clientWidth
            setCenterTextStyle({ maxWidth: clientWidth - 32 })
          }
          detectMaxWidth()
        })
      }
      detectMaxWidth()

      return () => {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  const onBackClick = () => {
    pop()
  }

  return (
    <Observer>
      {() => {
        const screenInstanceOption = store.screenInstanceOptions.get(props.screenInstanceId)
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
              {navigatorOptions.theme === 'Cupertino' && props.isPresent ? <IconClose /> : <IconBack />}
            </div>
          ))

        const isLeft = !!(
          (screenInstanceOption?.navbar.closeButtonLocation === 'left' && closeButton) ||
          backButton ||
          screenInstanceOption?.navbar.appendLeft
        )

        const center = (
          <div className={styles.navbarCenter} ref={centerRef}>
            <div
              className={classnames(styles.navbarCenterText, {
                [styles.isLeft]: isLeft,
                [styles.android]: props.theme === 'Android',
                [styles.cupertino]: props.theme === 'Cupertino',
              })}>
              <div style={centerTextStyle}>{screenInstanceOption?.navbar.title}</div>
            </div>
          </div>
        )

        return (
          <div className={styles.navbarContainer}>
            <div
              className={classnames(styles.navbarMain, {
                [styles.android]: props.theme === 'Android',
                [styles.cupertino]: props.theme === 'Cupertino',
              })}>
              <div className={styles.navbarFlex}>
                <div className={styles.navbarLeft}>
                  {screenInstanceOption?.navbar.closeButtonLocation === 'left' && closeButton}
                  {backButton}
                  {screenInstanceOption?.navbar.appendLeft}
                </div>
                {center}
                <div className={styles.navbarRight}>
                  {screenInstanceOption?.navbar.appendRight}
                  {screenInstanceOption?.navbar.closeButtonLocation === 'right' && closeButton}
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

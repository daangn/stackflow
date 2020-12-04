import classnames from 'classnames'
import { Observer } from 'mobx-react-lite'
import React from 'react'

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
  onClose: () => void
}
const Navbar: React.FC<NavbarProps> = (props) => {
  const { pop } = useNavigator()
  const navigatorOptions = useNavigatorOptions()

  const onBackClick = () => {
    pop()
  }

  return (
    <Observer>
      {() => {
        const screenInstanceOption = store.screenInstanceOptions.get(props.screenInstanceId)
        const closeButton =
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
          <div
            className={classnames(styles.navbarCenter, {
              [styles.isLeft]: isLeft,
              [styles.android]: props.theme === 'Android',
              [styles.cupertino]: props.theme === 'Cupertino',
            })}>
            {screenInstanceOption?.navbar.title}
          </div>
        )

        return (
          <div
            className={classnames(styles.navbarContainer, {
              [styles.android]: props.theme === 'Android',
              [styles.cupertino]: props.theme === 'Cupertino',
            })}>
            {props.theme === 'Cupertino' && center}
            <div className={styles.navbarFlex}>
              <div className={styles.navbarLeft}>
                {screenInstanceOption?.navbar.closeButtonLocation === 'left' && closeButton}
                {backButton}
                {screenInstanceOption?.navbar.appendLeft}
              </div>
              {props.theme === 'Android' && center}
              <div className={styles.navbarRight}>
                {screenInstanceOption?.navbar.appendRight}
                {screenInstanceOption?.navbar.closeButtonLocation === 'right' && closeButton}
              </div>
            </div>
          </div>
        )
      }}
    </Observer>
  )
}

export default Navbar

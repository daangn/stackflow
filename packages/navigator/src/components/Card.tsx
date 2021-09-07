import React, { useCallback, useEffect, useRef, useState } from 'react'
import zenscroll from 'zenscroll'

import { useStore, useStoreSelector } from '../store'
import { INavigatorTheme } from '../types'
import { useNavigator } from '../useNavigator'
import * as css from './Card.css'
import { makeTranslation } from './Card.translation'
import Navbar from './Navbar'

interface ICardProps {
  theme: INavigatorTheme
  nodeRef: React.RefObject<HTMLDivElement>
  beforeTopFrameOffsetRef: React.RefObject<HTMLDivElement>
  screenPath: string
  screenInstanceId: string
  isRoot: boolean
  isTop: boolean
  isBeforeTop: boolean
  isPresent: boolean
  backButtonAriaLabel: string
  closeButtonAriaLabel: string
  onClose?: () => void
}
const Card: React.FC<ICardProps> = (props) => {
  const { pop } = useNavigator()

  const android = props.theme === 'Android'
  const cupertino = props.theme === 'Cupertino'

  const [popped, setPopped] = useState(false)

  const store = useStore()
  const { screenInstanceOptions } = useStoreSelector((state) => ({
    screenInstanceOptions: state.screenInstanceOptions,
  }))
  const dimRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const frameOffsetRef = props.beforeTopFrameOffsetRef
  const edgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const $dim = dimRef.current
    const $frame = frameRef.current
    const $frameOffset = frameOffsetRef.current
    const $edge = edgeRef.current

    if (!$dim || !$frame || !$frameOffset || !$edge) {
      return
    }

    let x0: number | null = null
    let t0: number | null = null
    let x: number | null = null

    const resetState = () => {
      x0 = null
      t0 = null
      x = null
    }

    const { translate, resetTranslation } = makeTranslation({
      $dim,
      $frame,
      $frameOffset,
    })

    const onTouchStart = (e: TouchEvent) => {
      x0 = e.touches[0].clientX
      t0 = Date.now()

      const { activeElement } = document as any
      activeElement?.blur?.()
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!x0) {
        return resetState()
      }

      x = e.touches[0].clientX

      translate({
        dx: x - x0,
      })
    }

    const onTouchEnd = () => {
      if (!x0 || !t0 || !x) {
        return resetState()
      }

      const t = Date.now()
      const v = (x - x0) / (t - t0)

      if (v > 1 || x / window.screen.width > 0.4) {
        setPopped(true)
        pop()
      }

      resetState()
      resetTranslation()
    }

    $edge.addEventListener('touchstart', onTouchStart)
    $edge.addEventListener('touchmove', onTouchMove)
    $edge.addEventListener('touchend', onTouchEnd)

    return () => {
      $edge.removeEventListener('touchstart', onTouchStart)
      $edge.removeEventListener('touchmove', onTouchMove)
      $edge.removeEventListener('touchend', onTouchEnd)
    }
  }, [dimRef, frameRef, frameOffsetRef, edgeRef, setPopped, pop])

  const onTopClick = useCallback(() => {
    const $frame = frameRef.current

    const screenInstanceOption =
      store.getState().screenInstanceOptions[props.screenInstanceId]

    if (!screenInstanceOption?.navbar.disableScrollToTop && $frame) {
      const scroller = zenscroll.createScroller($frame)
      scroller.toY(0)
    }

    screenInstanceOption?.navbar.onTopClick?.()
  }, [])

  const isNavbarVisible =
    screenInstanceOptions[props.screenInstanceId]?.navbar.visible ?? false

  return (
    <div ref={props.nodeRef} className={css.container}>
      {!props.isRoot && (
        <div
          className={css.dim({
            android,
            cupertinoAndIsNavbarVisible: cupertino && isNavbarVisible,
            cupertinoAndIsPresent: cupertino && props.isPresent,
          })}
          ref={dimRef}
        />
      )}
      <div
        className={css.mainOffset({
          androidAndIsNotTop: android && !props.isTop,
        })}
      >
        <div
          className={css.main({
            android,
            androidAndIsNavbarVisible: android && isNavbarVisible,
            androidAndIsRoot: android && props.isRoot,
            cupertinoAndIsNavbarVisible: cupertino && isNavbarVisible,
            cupertinoAndIsPresent: cupertino && props.isPresent,
          })}
        >
          {isNavbarVisible && (
            <Navbar
              screenInstanceId={props.screenInstanceId}
              theme={props.theme}
              isRoot={props.isRoot}
              isPresent={props.isPresent}
              backButtonAriaLabel={props.backButtonAriaLabel}
              closeButtonAriaLabel={props.closeButtonAriaLabel}
              onClose={props.onClose}
              onTopClick={onTopClick}
            />
          )}
          <div
            className={css.frameOffset({
              cupertinoAndIsNotPresent: cupertino && !props.isPresent,
              cupertinoAndIsNotTop: cupertino && !props.isTop,
            })}
            ref={props.isBeforeTop ? props.beforeTopFrameOffsetRef : undefined}
          >
            <div
              className={css.frame({
                cupertino,
                cupertinoAndIsNotRoot: cupertino && !props.isRoot,
                cupertinoAndIsPresent: cupertino && props.isPresent,
                cupertinoAndIsNotPresent: cupertino && !props.isPresent,
              })}
              ref={frameRef}
            >
              {props.children}
            </div>
          </div>
          {cupertino && !props.isRoot && !props.isPresent && !popped && (
            <div
              className={css.edge({
                cupertinoAndIsNavbarVisible: cupertino && isNavbarVisible,
                isNavbarVisible,
              })}
              ref={edgeRef}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Card

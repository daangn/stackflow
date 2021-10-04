import React, { useCallback, useEffect, useRef, useState } from 'react'

import { INavigatorTheme } from '../types'
import { useNavigator } from '../useNavigator'
import * as css from './Card.css'
import { makeTranslation } from './Card.translation'
import Navbar from './Navbar'
import { useScreenHelmet } from './Stack.ContextScreenHelmet'

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
  const { screenHelmetVisible, screenHelmetProps } = useScreenHelmet()
  const [popped, setPopped] = useState(false)

  const dimRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const frameOffsetRef = props.beforeTopFrameOffsetRef
  const edgeRef = useRef<HTMLDivElement>(null)

  const android = props.theme === 'Android'
  const cupertino = props.theme === 'Cupertino'

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
      document.activeElement?.['blur']?.()
      x0 = x = e.touches[0].clientX
      t0 = Date.now()
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

      if (v > 1 || x / $frame.clientWidth > 0.4) {
        setPopped(true)
        pop()
      }

      resetState()
      resetTranslation()
    }

    $edge.addEventListener('touchstart', onTouchStart, { passive: true })
    $edge.addEventListener('touchmove', onTouchMove, { passive: true })
    $edge.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      $edge.removeEventListener('touchstart', onTouchStart)
      $edge.removeEventListener('touchmove', onTouchMove)
      $edge.removeEventListener('touchend', onTouchEnd)
    }
  }, [dimRef, frameRef, frameOffsetRef, edgeRef, setPopped, pop])

  const onTopClick = useCallback(() => {
    const $frame = frameRef.current

    if (!screenHelmetProps.disableScrollToTop && $frame) {
      $frame.scroll({
        top: 0,
        behavior: 'smooth',
      })
    }

    screenHelmetProps.onTopClick?.()
  }, [screenHelmetProps])

  const isNavbarVisible = screenHelmetVisible ?? false

  return (
    <div ref={props.nodeRef} className={css.container}>
      {!props.isRoot && (
        <div
          className={css.dim({
            android: android ? true : undefined,
            cupertinoAndIsNavbarVisible:
              cupertino && isNavbarVisible ? true : undefined,
            cupertinoAndIsPresent:
              cupertino && props.isPresent ? true : undefined,
          })}
          ref={dimRef}
        />
      )}
      <div
        className={css.mainOffset({
          androidAndIsNotTop: android && !props.isTop ? true : undefined,
        })}
      >
        <div
          className={css.main({
            android: android ? true : undefined,
            androidAndIsNavbarVisible:
              android && isNavbarVisible ? true : undefined,
            androidAndIsRoot: android && props.isRoot ? true : undefined,
            cupertinoAndIsNavbarVisible:
              cupertino && isNavbarVisible ? true : undefined,
            cupertinoAndIsPresent:
              cupertino && props.isPresent ? true : undefined,
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
              cupertinoAndIsNotPresent:
                cupertino && !props.isPresent ? true : undefined,
              cupertinoAndIsNotTop:
                cupertino && !props.isTop ? true : undefined,
            })}
            ref={props.isBeforeTop ? props.beforeTopFrameOffsetRef : undefined}
          >
            <div
              className={css.frame({
                cupertino: cupertino ? true : undefined,
                cupertinoAndIsNotRoot:
                  cupertino && !props.isRoot ? true : undefined,
                cupertinoAndIsPresent:
                  cupertino && props.isPresent ? true : undefined,
                cupertinoAndIsNotPresent:
                  cupertino && !props.isPresent ? true : undefined,
              })}
              ref={frameRef}
            >
              {props.children}
            </div>
          </div>
          {cupertino && !props.isRoot && !props.isPresent && !popped && (
            <div
              className={css.edge({
                cupertinoAndIsNavbarVisible:
                  cupertino && isNavbarVisible ? true : undefined,
                isNavbarVisible: isNavbarVisible ? true : undefined,
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

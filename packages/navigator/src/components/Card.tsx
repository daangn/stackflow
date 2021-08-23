import React, { useCallback, useEffect, useRef, useState } from 'react'
import zenscroll from 'zenscroll'

import { NavigatorTheme } from '../helpers'
import { useStore, useStoreActions, useStoreSelector } from '../store'
import { useNavigator } from '../useNavigator'
import * as css from './Card.css'
import Navbar from './Navbar'

const $frameOffsetSet = new Set<HTMLDivElement>()

interface CardProps {
  theme: NavigatorTheme
  nodeRef: React.RefObject<HTMLDivElement>
  screenPath: string
  screenInstanceId: string
  isRoot: boolean
  isTop: boolean
  isPresent: boolean
  onClose?: () => void
}
const Card: React.FC<CardProps> = (props) => {
  const navigator = useNavigator()

  const android = props.theme === 'Android'
  const cupertino = props.theme === 'Cupertino'

  const [popped, setPopped] = useState(false)

  const store = useStore()
  const { screenEdge, screenInstanceOptions } = useStoreSelector((state) => ({
    screenEdge: state.screenEdge,
    screenInstanceOptions: state.screenInstanceOptions,
  }))
  const { setScreenEdge } = useStoreActions()

  const x = useRef<number>(0)
  const requestAnimationFrameLock = useRef<boolean>(false)

  const dimRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const frameOffsetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const $frameOffset = frameOffsetRef.current

    if ($frameOffset) {
      $frameOffsetSet.add($frameOffset)

      return () => {
        $frameOffsetSet.delete($frameOffset)
      }
    }
  }, [frameOffsetRef.current])

  const onEdgeTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      ;(document.activeElement as any)?.blur?.()

      setScreenEdge({
        screenEdge: {
          startX: e.touches[0].clientX,
          startTime: Date.now(),
        },
      })
    },
    []
  )

  const onEdgeTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (screenEdge.startX) {
        x.current = e.touches[0].clientX

        if (!requestAnimationFrameLock.current) {
          requestAnimationFrameLock.current = true

          requestAnimationFrame(() => {
            if (x.current > 0) {
              const computedEdgeX = x.current - screenEdge.startX!

              const $dim = dimRef.current
              const $frame = frameRef.current

              if (computedEdgeX >= 0) {
                if ($dim) {
                  $dim.style.opacity = `${
                    1 - computedEdgeX / window.screen.width
                  }`
                  $dim.style.transition = '0s'
                }
                if ($frame) {
                  $frame.style.overflowY = 'hidden'
                  $frame.style.transform = `translateX(${computedEdgeX}px)`
                  $frame.style.transition = '0s'
                }
                $frameOffsetSet.forEach(($frameOffset) => {
                  if ($frameOffset !== frameOffsetRef.current) {
                    $frameOffset.style.transform = `translateX(-${
                      5 - (5 * computedEdgeX) / window.screen.width
                    }rem)`
                    $frameOffset.style.transition = '0s'
                  }
                })
              }
            }

            requestAnimationFrameLock.current = false
          })
        }
      }
    },
    [screenEdge]
  )

  const onEdgeTouchEnd = useCallback(() => {
    if (x.current) {
      const velocity =
        x.current / (Date.now() - (screenEdge.startTime as number))

      if (velocity > 1 || x.current / window.screen.width > 0.4) {
        setPopped(true)
        navigator.pop()
      }

      setScreenEdge({
        screenEdge: {
          startX: null,
          startTime: null,
        },
      })

      x.current = 0

      requestAnimationFrame(() => {
        const $dim = dimRef.current
        const $frame = frameRef.current

        if ($dim) {
          $dim.style.opacity = ''
          $dim.style.transition = ''
        }
        if ($frame) {
          $frame.style.overflowY = ''
          $frame.style.transform = ''
          $frame.style.transition = ''
        }
        $frameOffsetSet.forEach(($frameOffset) => {
          $frameOffset.style.transform = ''
          $frameOffset.style.transition = ''
        })
      })
    }
  }, [screenEdge])

  const onTopClick = useCallback(() => {
    const screenInstanceOption =
      store.getState().screenInstanceOptions[props.screenInstanceId]

    if (!screenInstanceOption?.navbar.disableScrollToTop && frameRef.current) {
      const scroller = zenscroll.createScroller(frameRef.current)
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
              onClose={props.onClose}
              onTopClick={onTopClick}
            />
          )}
          <div
            className={css.frameOffset({
              cupertinoAndIsNotPresent: cupertino && !props.isPresent,
              cupertinoAndIsNotTop: cupertino && !props.isTop,
            })}
            ref={frameOffsetRef}
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
              onTouchStart={onEdgeTouchStart}
              onTouchMove={onEdgeTouchMove}
              onTouchEnd={onEdgeTouchEnd}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Card

import classnames from 'classnames'
import { Observer } from 'mobx-react-lite'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useNavigatorOptions } from '../contexts'
import store, { setScreenEdge } from '../store'
import { useNavigator } from '../useNavigator'
import styles from './Card.scss'
import Navbar from './Navbar'

const $frameOffsetSet = new Set<HTMLDivElement>()

interface CardProps {
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
  const navigatorOptions = useNavigatorOptions()

  const [loading, setLoading] = useState(props.isRoot)
  const [popped, setPopped] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoading(false), 0)
  }, [])

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
        startX: e.touches[0].clientX,
        startTime: Date.now(),
      })
    },
    []
  )

  const onEdgeTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (store.screenEdge.startX) {
      x.current = e.touches[0].clientX

      if (!requestAnimationFrameLock.current) {
        requestAnimationFrameLock.current = true

        requestAnimationFrame(() => {
          if (x.current > 0) {
            const computedEdgeX = x.current - store.screenEdge.startX!

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
  }, [])

  const onEdgeTouchEnd = useCallback(() => {
    if (x.current) {
      const velocity =
        x.current / (Date.now() - (store.screenEdge.startTime as number))

      if (velocity > 1 || x.current / window.screen.width > 0.4) {
        setPopped(true)
        navigator.pop()
      }

      setScreenEdge({
        startX: null,
        startTime: null,
      })
      x.current = 0

      requestAnimationFrame(() => {
        const $dim = dimRef.current
        const $frame = frameRef.current

        if ($dim) {
          $dim.style.opacity = ''
          $dim.style.transition = `opacity ${navigatorOptions.animationDuration}ms`
        }
        if ($frame) {
          $frame.style.overflowY = ''
          $frame.style.transform = ''
          $frame.style.transition =
            navigatorOptions.theme === 'Cupertino'
              ? `transform ${navigatorOptions.animationDuration}ms`
              : ''
        }
        $frameOffsetSet.forEach(($frameOffset) => {
          $frameOffset.style.transform = ''
          $frameOffset.style.transition = `transform ${navigatorOptions.animationDuration}ms`
        })
      })
    }
  }, [])

  const onTopClick = useCallback(() => {
    const screenInstanceOption = store.screenInstanceOptions.get(
      props.screenInstanceId
    )

    if (!screenInstanceOption?.navbar.disableScrollToTop) {
      frameRef.current?.scroll({
        top: 0,
        behavior: 'smooth',
      })
    }

    screenInstanceOption?.navbar.onTopClick?.()
  }, [])

  return (
    <Observer>
      {() => {
        const screenInstanceOption = store.screenInstanceOptions.get(
          props.screenInstanceId
        )

        return (
          <div
            ref={props.nodeRef}
            className={classnames(styles.cardTransitionNode, {
              [styles.isNotPresent]: !props.isPresent,
              [styles.isPresent]: props.isPresent,
            })}
          >
            {!props.isRoot && (
              <div
                ref={dimRef}
                className={classnames(styles.cardDim, {
                  [styles.isLoading]: loading,
                  [styles.isNavbarVisible]: !!screenInstanceOption?.navbar
                    .visible,
                  [styles.isPresent]: props.isPresent,
                })}
                style={{
                  transition: `opacity ${navigatorOptions.animationDuration}ms`,
                }}
              />
            )}
            <div
              className={classnames(styles.cardMainOffset, {
                [styles.isNotTop]: !props.isTop,
                [styles.isLoading]: loading,
              })}
              style={{
                transition: `transform ${navigatorOptions.animationDuration}ms`,
              }}
            >
              <div
                className={classnames(styles.cardMain, {
                  [styles.isNavbarVisible]: !!screenInstanceOption?.navbar
                    .visible,
                  [styles.isPresent]: props.isPresent,
                  [styles.isRoot]: props.isRoot,
                })}
                style={{
                  transition:
                    navigatorOptions.theme === 'Cupertino' && props.isPresent
                      ? `transform ${navigatorOptions.animationDuration}ms`
                      : navigatorOptions.theme === 'Android'
                      ? `transform ${navigatorOptions.animationDuration}ms, opacity ${navigatorOptions.animationDuration}ms`
                      : undefined,
                }}
              >
                {!!screenInstanceOption?.navbar.visible && (
                  <Navbar
                    screenInstanceId={props.screenInstanceId}
                    theme={navigatorOptions.theme}
                    isRoot={props.isRoot}
                    isPresent={props.isPresent}
                    onClose={props.onClose}
                    onTopClick={onTopClick}
                  />
                )}
                <div
                  ref={frameOffsetRef}
                  className={classnames(styles.cardFrameOffset, {
                    [styles.isNotTop]: !props.isTop,
                  })}
                  style={{
                    transition: `transform ${navigatorOptions.animationDuration}ms`,
                  }}
                >
                  <div
                    ref={frameRef}
                    className={classnames(styles.cardFrame, {
                      [styles.isNotRoot]: !props.isRoot,
                      [styles.isPresent]: props.isPresent,
                    })}
                    style={{
                      transition:
                        navigatorOptions.theme === 'Cupertino'
                          ? `transform ${navigatorOptions.animationDuration}ms`
                          : undefined,
                    }}
                  >
                    {props.children}
                  </div>
                </div>
                {navigatorOptions.theme === 'Cupertino' &&
                  !props.isRoot &&
                  !props.isPresent &&
                  !popped && (
                    <div
                      className={classnames(styles.cardEdge, {
                        [styles.isNavbarNotVisible]: !screenInstanceOption
                          ?.navbar.visible,
                        [styles.isNavbarVisible]: !!screenInstanceOption?.navbar
                          .visible,
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
      }}
    </Observer>
  )
}

export default Card

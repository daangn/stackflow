import React, { useEffect, useRef, useState } from 'react'

import FallbackSpinner from './FallbackSpinner'
import { mergeRefs } from './mergeRefs'
import * as css from './PullToRefresh.css'
import { makeTranslation } from './PullToRefresh.translation'

type PullToRefreshProps = React.PropsWithChildren<{
  /**
   * Class name appended to root div element
   */
  className?: string

  /**
   * Ref of div element with `overflow: scroll` attribute
   */
  scrollContainerRef?: React.RefObject<HTMLDivElement>

  /**
   * Called when pulled
   */
  onPull: (dispose: () => void) => void

  /**
   * Custom spinner
   */
  customSpinner?: React.ComponentType<{ t: number; refreshing: boolean }>

  /**
   * Disable pulling
   */
  disabled?: boolean
}>
const PullToRefresh = React.forwardRef<HTMLDivElement, PullToRefreshProps>(
  (props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const spinnerContainerRef = useRef<HTMLDivElement>(null)

    const [t, setT] = useState(0)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
      if (props.disabled) {
        return
      }

      const $scrollContainer = scrollContainerRef.current
      const $spinnerContainer = spinnerContainerRef.current

      if (!$scrollContainer || !$spinnerContainer) {
        return
      }

      let pulling: boolean = false
      let refreshing: boolean = false
      let y0: number | null = null
      let Δy: number | null = null

      const resetState = () => {
        pulling = false
        refreshing = false
        y0 = null
        Δy = null
      }

      const { translate, resetTranslation } = makeTranslation($scrollContainer)

      const onTouchStart = () => {
        if (refreshing || $scrollContainer.scrollTop > 0) {
          return
        }

        pulling = true
      }

      const onTouchMove = (e: TouchEvent) => {
        if (refreshing || !pulling) {
          return
        }

        const spinnerHeight = $spinnerContainer.clientHeight
        const y = e.touches[0].clientY

        if (!y0) {
          y0 = y
        }

        Δy = y - y0

        const t = (Δy: number) => Δy / spinnerHeight

        if (t(Δy) <= 0) {
          translate({
            y: 0,
            onAnimationFrame: () => setT(0),
          })
        }

        if (t(Δy) > 0 && t(Δy) < 1) {
          translate({
            y: Δy,
            onAnimationFrame: (Δy) => setT(t(Δy)),
          })
        }

        if (t(Δy) >= 1) {
          translate({
            y: spinnerHeight + (Δy - spinnerHeight) / 6,
            onAnimationFrame: () => setT(1),
          })
        }
      }

      const onTouchEnd = async () => {
        const spinnerHeight = $spinnerContainer.clientHeight

        if (Δy === null) {
          return
        }

        async function dispose() {
          setRefreshing(false)
          await resetTranslation()
          resetState()
        }

        const pulled = Δy > spinnerHeight

        if (!pulled) {
          return dispose()
        }

        refreshing = true
        setRefreshing(true)
        translate({ y: spinnerHeight, smooth: true, force: true })

        props.onPull(dispose)
      }

      $scrollContainer.addEventListener('touchstart', onTouchStart)
      $scrollContainer.addEventListener('scroll', onTouchStart)
      $scrollContainer.addEventListener('touchmove', onTouchMove)
      $scrollContainer.addEventListener('touchend', onTouchEnd)

      return () => {
        $scrollContainer.removeEventListener('touchstart', onTouchStart)
        $scrollContainer.removeEventListener('scroll', onTouchStart)
        $scrollContainer.removeEventListener('touchmove', onTouchMove)
        $scrollContainer.removeEventListener('touchend', onTouchEnd)
      }
    }, [setT, setRefreshing, props.disabled])

    const Spinner = props.customSpinner ?? FallbackSpinner

    return (
      <div
        ref={mergeRefs([ref, containerRef])}
        className={[
          css.container,
          ...(props.className ? [props.className] : []),
        ].join(' ')}
      >
        <div ref={spinnerContainerRef} className={css.spinnerContainer}>
          <Spinner t={t} refreshing={refreshing} />
        </div>
        <div
          ref={mergeRefs([scrollContainerRef, props.scrollContainerRef])}
          className={css.scrollContainer}
        >
          {props.children}
        </div>
      </div>
    )
  }
)

export default PullToRefresh

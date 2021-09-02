import React, { useEffect, useRef, useState } from 'react'

import { mergeRefs } from '../mergeRefs'
import { ICustomSpinner } from '../types'
import FallbackSpinner from './FallbackSpinner'
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
  customSpinner?: ICustomSpinner

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
      let dy: number | null = null

      const resetState = () => {
        pulling = false
        refreshing = false
        y0 = null
        dy = null
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

        dy = y - y0

        const t = (dy: number) => dy / spinnerHeight

        if (t(dy) <= 0) {
          translate({
            y: 0,
            onAnimationFrame: () => setT(0),
          })
        }

        if (t(dy) > 0 && t(dy) < 1) {
          translate({
            y: dy,
            onAnimationFrame: (dy) => setT(t(dy)),
          })
        }

        if (t(dy) >= 1) {
          translate({
            y: spinnerHeight + (dy - spinnerHeight) / 6,
            onAnimationFrame: () => setT(1),
          })
        }
      }

      const onTouchEnd = async () => {
        const spinnerHeight = $spinnerContainer.clientHeight

        if (dy === null) {
          return
        }

        function dispose() {
          resetTranslation()
          resetState()
          setRefreshing(false)
        }

        const pulled = dy > spinnerHeight

        if (!pulled) {
          return dispose()
        }

        translate({ y: spinnerHeight, smooth: true, force: true })
        refreshing = true
        setRefreshing(true)

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
    }, [props.disabled, props.onPull])

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

import React, { useEffect, useRef, useState } from 'react'

import FallbackSpinner from './FallbackSpinner'
import { mergeRefs } from './mergeRefs'
import * as css from './PullToRefresh.css'
import { makeTranslate } from './PullToRefresh.translate'

interface PullToRefreshProps {
  containerRef?: React.RefObject<HTMLDivElement>
  containerClassName?: string
  scrollContainerRef?: React.RefObject<HTMLDivElement>
  onRefresh?: (dispose: () => void) => void
  spinner?: React.ComponentType<{ t: number; loading: boolean }>
}
const PullToRefresh: React.FC<PullToRefreshProps> = (props) => {
  const [spinnerT, setSpinnerT] = useState(0)
  const [spinnerLoading, setSpinnerLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const spinnerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const $scrollContainer = scrollContainerRef.current
    const $spinnerContainer = spinnerContainerRef.current

    if (!$scrollContainer || !$spinnerContainer) {
      return
    }

    const { translate: translate1, reset } = makeTranslate($scrollContainer)
    const { translate: translate2 } = makeTranslate($scrollContainer, {
      enableTransition: true,
    })

    let y0: number | null = null
    let dy: number | null = null
    let nowRefreshing: boolean = false

    const onTouchStart = (e: TouchEvent) => {
      const y = e.touches[0].clientY

      if (nowRefreshing || $scrollContainer.scrollTop > 0) {
        return
      }

      y0 = y
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY

      if (nowRefreshing || y0 === null) {
        return
      }
      if (y - y0 > 0) {
        e.preventDefault()
        dy = y - y0
      } else {
        dy = 0
      }

      const spinnerHeight = $spinnerContainer.clientHeight

      if (dy > spinnerHeight) {
        const y = spinnerHeight + (dy - spinnerHeight) / 6

        translate1({ y }).then(() => {
          setSpinnerT(1)
        })
      } else {
        translate1({ y: dy }).then((y) => {
          setSpinnerT(y / spinnerHeight)
        })
      }
    }

    const onTouchEnd = async () => {
      const $spinnerContainer = spinnerContainerRef.current

      if (dy === null || !$spinnerContainer) {
        return
      }

      const spinnerHeight = $spinnerContainer.clientHeight

      if (dy > spinnerHeight) {
        nowRefreshing = true
        setSpinnerLoading(true)
        translate2({ y: spinnerHeight })

        if (props.onRefresh) {
          props.onRefresh(() => {
            setSpinnerLoading(false)
            reset().then(() => {
              y0 = null
              dy = null
              nowRefreshing = false
            })
          })
        } else {
          setTimeout(() => {
            setSpinnerLoading(false)
            reset().then(() => {
              y0 = null
              dy = null
              nowRefreshing = false
            })
          }, 700)
        }
      } else {
        reset().then(() => {
          y0 = null
          dy = null
          nowRefreshing = false
        })
      }
    }

    $scrollContainer.addEventListener('touchstart', onTouchStart)
    $scrollContainer.addEventListener('touchmove', onTouchMove)
    $scrollContainer.addEventListener('touchend', onTouchEnd)

    return () => {
      $scrollContainer.removeEventListener('touchstart', onTouchStart)
      $scrollContainer.removeEventListener('touchmove', onTouchMove)
      $scrollContainer.removeEventListener('touchend', onTouchEnd)
    }
  }, [setSpinnerT, setSpinnerLoading])

  const Spinner = props.spinner ?? FallbackSpinner

  return (
    <div
      ref={mergeRefs([containerRef, props.containerRef])}
      className={[
        css.container,
        ...(props.containerClassName ? [props.containerClassName] : []),
      ].join(' ')}
    >
      <div ref={spinnerContainerRef} className={css.spinnerContainer}>
        <Spinner t={spinnerT} loading={spinnerLoading} />
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

export default PullToRefresh

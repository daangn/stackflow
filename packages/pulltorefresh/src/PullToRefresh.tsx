import React, { useEffect, useRef } from 'react'

import { mergeRefs } from './mergeRefs'
import * as css from './PullToRefresh.css'

interface PullToRefreshProps {
  containerRef?: React.RefObject<HTMLDivElement>
  scrollContainerRef?: React.RefObject<HTMLDivElement>
}
const PullToRefresh: React.FC<PullToRefreshProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let y0: number | null = null
    let dy: number | null = null

    const onTouchStart = (e: TouchEvent) => {
      const y = e.touches[0].clientY

      if (!scrollContainerRef.current) {
        return
      }
      if (scrollContainerRef.current.scrollTop > 0) {
        return
      }

      y0 = y
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY

      if (y0 === null) {
        return
      }
      if (y - y0 > 0) {
        dy = y - y0
      } else {
        dy = 0
      }

      console.log(dy)
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener('touchstart', onTouchStart)
      scrollContainerRef.current.addEventListener('touchmove', onTouchMove)
    }
  }, [])

  return (
    <div
      ref={mergeRefs([containerRef, props.containerRef])}
      className={css.container}
    >
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

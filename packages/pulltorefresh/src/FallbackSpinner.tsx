import React, { useMemo } from 'react'

import * as css from './FallbackSpinner.css'
import { vars } from './theme.css'

const SIZE = 45
const BAR_WIDTH = 8
const BAR_COUNT = 10

interface FallbackSpinnerProps {
  t: number
  loading: boolean
}
const FallbackSpinner: React.FC<FallbackSpinnerProps> = (props) => {
  const directions = useMemo(() => {
    const center = SIZE / 2
    const radius = center - BAR_WIDTH * 1.25
    const it = 360 / (BAR_COUNT * 2)
    const directions = []
    const oneAngle = (it * Math.PI) / 90

    for (let i = 180; i >= 0; i -= it) {
      const angle = (i * Math.PI) / 90 + oneAngle

      const fromX = center - Math.sin(angle) * radius
      const fromY = center - Math.cos(angle) * radius

      const toX = center - Math.sin(angle) * (radius + 8)
      const toY = center - Math.cos(angle) * (radius + 8)

      directions.push(`M${fromX} ${fromY}, ${toX} ${toY}`)
    }
    return directions
  }, [])

  const currentValue = useMemo(() => BAR_COUNT * props.t, [props.t])

  return (
    <div className={css.container}>
      <svg
        className={props.loading ? css.spinner.spin : css.spinner.normal}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          opacity: props.t,
        }}
      >
        {directions.map((direction, idx) => (
          <path
            key={idx}
            d={direction}
            fill="transparent"
            strokeWidth={5}
            strokeLinecap="round"
            stroke={
              idx === 0
                ? 'transparent'
                : currentValue >= idx
                ? vars.fallbackSpinnerColor
                : 'transparent'
            }
          />
        ))}
      </svg>
    </div>
  )
}

export default FallbackSpinner

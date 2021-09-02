import React, { useMemo } from 'react'

import { vars } from '../theme.css'
import { ICustomSpinner } from '../types'
import * as css from './FallbackSpinner.css'

const SIZE = 28.75
const BAR_COUNT = 10

const FallbackSpinner: ICustomSpinner = (props) => {
  const directions = useMemo(() => {
    const center = SIZE / 2
    const radius = SIZE / 3.83
    const it = 360 / (BAR_COUNT * 2)
    const directions = []
    const oneAngle = (it * Math.PI) / 90

    for (let i = 180; i >= 0; i -= it) {
      const angle = (i * Math.PI) / 90 + oneAngle

      const fromX = center - Math.sin(angle) * radius
      const fromY = center - Math.cos(angle) * radius

      const toX = center - Math.sin(angle) * (radius + SIZE / 5.75)
      const toY = center - Math.cos(angle) * (radius + SIZE / 5.75)

      directions.push(`M${fromX} ${fromY}, ${toX} ${toY}`)
    }
    return directions
  }, [])

  const currentValue = useMemo(() => BAR_COUNT * props.t, [props.t])

  return (
    <div className={css.container}>
      <svg
        className={props.refreshing ? css.spinner.spin : css.spinner.normal}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          opacity: props.t,
        }}
      >
        {directions.map((direction, idx) => (
          <path
            className={css.spinnerPath}
            key={idx}
            d={direction}
            fill="transparent"
            strokeWidth={3.125}
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

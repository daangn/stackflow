import React from 'react'

import { vars } from '../theme.css'
import { ICustomSpinner } from '../types'
import * as css from './FallbackSpinner.css'

const FallbackSpinner: ICustomSpinner = (props) => {
  const directions = [
    'M16.000000000000004 7.6449086161879904, 16.000000000000004 2.0796912248836428',
    'M20.910999496960613 9.240589080940389, 24.182152205370897 4.73823363398416',
    'M23.946164104815903 13.418134772846393, 29.23900036941502 11.698388021542339',
    'M23.946164104815903 18.581865227153607, 29.239000369415017 20.301611978457665',
    'M20.91099949696061 22.75941091905961, 24.182152205370894 27.26176636601584',
    'M15.999999999999998 24.35509138381201, 15.999999999999998 29.920308775116357',
    'M11.089000503039388 22.75941091905961, 7.8178477946291025 27.26176636601584',
    'M8.053835895184097 18.581865227153607, 2.7609996305849798 20.30161197845766',
    'M8.053835895184097 13.418134772846393, 2.7609996305849815 11.698388021542337',
    'M11.08900050303939 9.240589080940389, 7.817847794629104 4.738233633984159',
  ]

  return (
    <div className={css.container}>
      <svg
        className={props.refreshing ? css.spinner.spin : css.spinner.normal}
        width="32"
        height="32"
        viewBox="0 0 32 32"
        style={{
          opacity: props.offset,
        }}
      >
        {directions.map((direction, i) => (
          <path
            key={i}
            className={css.spinnerPath}
            d={direction}
            fill="transparent"
            strokeWidth="3"
            strokeLinecap="round"
            stroke={
              i < props.offset * 10 ? vars.fallbackSpinnerColor : 'transparent'
            }
          />
        ))}
      </svg>
    </div>
  )
}

export default FallbackSpinner

import { composeStyles, style } from '@vanilla-extract/css'

import { themeClass } from './theme.css'

export const root = composeStyles(
  themeClass,
  style({
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
  })
)

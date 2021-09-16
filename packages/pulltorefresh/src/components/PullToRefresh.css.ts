import { style } from '@vanilla-extract/css'

import { vars } from '../theme.css'

export const container = style({
  height: '100%',
  overflow: 'hidden',
  backgroundColor: vars.backgroundLowColor,
})

export const scrollContainer = style({
  height: '100%',
  overflowY: 'scroll',
  position: 'relative',
  WebkitOverflowScrolling: 'touch',
  transition: `transform ${vars.scrollContainer.transitionDuration}`,
  backgroundColor: vars.backgroundColor,
  zIndex: 1,
})

export const spinnerContainer = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
})

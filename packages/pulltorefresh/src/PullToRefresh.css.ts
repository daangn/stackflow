import { style } from '@vanilla-extract/css'

export const container = style({
  height: '100%',
  overflow: 'hidden',
})

export const scrollContainer = style({
  height: '100%',
  overflowY: 'scroll',
  position: 'relative',
  WebkitOverflowScrolling: 'touch',
})

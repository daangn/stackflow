import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { vars } from './theme.css'

export const container = style({
  display: 'flex',
  justifyContent: 'center',
  padding: '.25rem 0 1.5rem',
})

const spinning = keyframes({
  '0%': {
    transform: 'scale(0.625) rotate(0deg)',
  },
  '100%': {
    transform: 'scale(0.625) rotate(180deg)',
  },
})

export const spinner = styleVariants({
  normal: {
    transform: 'scale(0.625)',
  },
  spin: {
    transform: 'scale(0.625)',
    animation: `${spinning} ${vars.fallbackSpinnerAnimationDuration} infinite linear`,
  },
})

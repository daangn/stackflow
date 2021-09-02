import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { vars } from './theme.css'

export const container = style({
  display: 'flex',
  justifyContent: 'center',
  padding: '0.625rem 0 1.5rem',
})

const spinning = keyframes({
  '0%': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(180deg)',
  },
})

export const spinner = styleVariants({
  normal: {},
  spin: {
    animation: `${spinning} ${vars.fallbackSpinnerAnimationDuration} infinite linear`,
  },
})

export const spinnerPath = style({
  transition: 'stroke 200ms',
})

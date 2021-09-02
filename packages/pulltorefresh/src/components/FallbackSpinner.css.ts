import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { vars } from '../theme.css'

const spin = keyframes({
  '0%': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(180deg)',
  },
})

export const container = style({
  display: 'flex',
  justifyContent: 'center',
  padding: '0.75rem 0 1.75rem',
})

export const spinner = styleVariants({
  normal: {},
  spin: {
    animation: `${spin} ${vars.fallbackSpinnerAnimationDuration} infinite linear`,
  },
})

export const spinnerPath = style({
  transition: 'stroke 100ms',
})

import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

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

export const spinner = recipe({
  base: {},
  variants: {
    spin: {
      true: {
        animation: `${spin} ${vars.fallbackSpinner.animationDuration} infinite linear`,
      },
    },
  },
})

export const spinnerPath = style({
  transition: 'stroke 100ms',
})

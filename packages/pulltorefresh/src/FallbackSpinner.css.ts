import { keyframes, style, styleVariants } from '@vanilla-extract/css'

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
    transition: 'transform 300ms',
  },
  spin: {
    transform: 'scale(0.625)',
    transition: 'transform 300ms',
    animation: `${spinning} 0.75s infinite linear`,
  },
})

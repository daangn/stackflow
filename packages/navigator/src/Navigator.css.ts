import { vcn } from 'vanilla-classnames'

import { createTheme, style } from '@vanilla-extract/css'

const [themeClassAndroid, vars] = createTheme({
  backgroundColor: '#fff',
  dimBackgroundColor: 'rgba(0, 0, 0, 0.15)',
  navbar: {
    iconColor: '#212529',
    borderColor: 'rgba(0, 0, 0, 0.07)',
    borderSize: '1px',
    height: '3.5rem',
    center: {
      textColor: '#212529',
    },
  },
  animationDuration: '',
})

const themeClassCupertino = createTheme(vars, {
  backgroundColor: '#fff',
  dimBackgroundColor: 'rgba(0, 0, 0, 0.15)',
  navbar: {
    iconColor: '#212529',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderSize: '0.5px',
    height: '2.75rem',
    center: {
      textColor: '#212529',
    },
  },
  animationDuration: '',
})

export const root = vcn(
  style({
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
  }),
  {
    android: themeClassAndroid,
    cupertino: themeClassCupertino,
  }
)

export { vars }

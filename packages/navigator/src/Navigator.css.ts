import { createGlobalThemeContract, createTheme } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

const vars = createGlobalThemeContract(
  {
    backgroundColor: null,
    dimBackgroundColor: null,
    navbar: {
      iconColor: null,
      borderColor: null,
      borderSize: null,
      height: null,
      center: {
        textColor: null,
        mainWidth: null,
      },
      animationDuration: '',
      translateY: null,
    },
    animationDuration: '',
  },
  (_, path) => `kf_navigator_${path.join('-')}`
)

const Android = createTheme(vars, {
  backgroundColor: '#fff',
  dimBackgroundColor: 'rgba(0, 0, 0, 0.15)',
  navbar: {
    iconColor: '#212529',
    borderColor: 'rgba(0, 0, 0, 0.07)',
    borderSize: '1px',
    height: '3.5rem',
    center: {
      textColor: '#212529',
      mainWidth: '',
    },
    animationDuration: '',
    translateY: '0',
  },
  animationDuration: '',
})

const Cupertino = createTheme(vars, {
  backgroundColor: '#fff',
  dimBackgroundColor: 'rgba(0, 0, 0, 0.15)',
  navbar: {
    iconColor: '#212529',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderSize: '0.5px',
    height: '2.75rem',
    center: {
      textColor: '#212529',
      mainWidth: '',
    },
    animationDuration: '',
    translateY: '0',
  },
  animationDuration: '',
})

export const root = recipe({
  base: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
  },
  variants: {
    theme: {
      Android,
      Cupertino,
    },
  },
})

export { vars }

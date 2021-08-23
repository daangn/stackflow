import { createTheme } from '@vanilla-extract/css'

const [themeClass, vars] = createTheme({
  backgroundColor: '#fff',
  dimBackgroundColor: 'rgba(0, 0, 0, 0.15)',
  navbar: {
    iconColor: '#212529',
    borderColor: {
      android: 'rgba(0, 0, 0, 0.07)',
      cupertino: 'rgba(0, 0, 0, 0.12)',
    },
    borderSize: {
      android: '1px',
      cupertino: '0.5px',
    },
    center: {
      textColor: '#212529',
      mainWidth: '',
    },
  },
  animationDuration: '',
})

export { themeClass, vars }

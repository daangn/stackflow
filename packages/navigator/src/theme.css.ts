import { createTheme } from '@vanilla-extract/css'

const [themeClass, vars] = createTheme({
  backgroundColor: '#fff',
  textColor: '#212529',
  navbarBorderColor: {
    android: 'rgba(0, 0, 0, 0.07)',
    cupertino: 'rgba(0, 0, 0, 0.12)',
  },
  navbarBorderSize: {
    android: '1px',
    cupertino: '0.5px',
  },
  dimBackgroundColor: 'rgba(0, 0, 0, 0.15)',
})

export { themeClass, vars }

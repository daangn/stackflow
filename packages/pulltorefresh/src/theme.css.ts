import { createTheme } from '@vanilla-extract/css'

const [theme, vars] = createTheme({
  backgroundLowColor: '#f2f3f6',
  backgroundColor: '#fff',
  fallbackSpinnerColor: '#fa6616',
})

export { theme, vars }

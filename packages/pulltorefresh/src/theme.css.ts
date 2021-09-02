import { createTheme } from '@vanilla-extract/css'

const [theme, vars] = createTheme({
  backgroundLowColor: '#f2f3f6',
  backgroundColor: '#fff',
  scrollContainerTransitionDuration: '300ms',
  fallbackSpinnerColor: '#fa6616',
  fallbackSpinnerAnimationDuration: '750ms',
})

export { theme, vars }

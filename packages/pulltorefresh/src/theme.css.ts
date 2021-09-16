import {
  createGlobalTheme,
  createGlobalThemeContract,
} from '@vanilla-extract/css'

const vars = createGlobalThemeContract(
  {
    backgroundLowColor: null,
    backgroundColor: null,
    scrollContainer: {
      transitionDuration: null,
    },
    fallbackSpinner: {
      color: null,
      animationDuration: null,
    },
  },
  (_, path) => `kf_pulltorefresh_${path.join('-')}`
)

createGlobalTheme(':root', vars, {
  backgroundLowColor: '#f2f3f6',
  backgroundColor: '#fff',
  scrollContainer: {
    transitionDuration: '300ms',
  },
  fallbackSpinner: {
    color: '#fa6616',
    animationDuration: '750ms',
  },
})

export { vars }

import { vcn } from 'vanilla-classnames'

import { composeStyles, createTheme, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'

const [themeClass, vars] = createTheme({
  tabBar: {
    backgroundColor: '#fff',
    borderColor: 'rgba(0, 0, 0, 0.07)',
    borderSize: '1px',
    baseFontColor: '#ADB1BA',
    activeFontColor: '#212124',
    indicator: {
      color: '#212124',
      width: '',
      transform: '',
    },
  },
  tabMain: {
    backgroundColor: '#fff',
    width: '',
    transform: '',
  },
})

export { vars }

export const container = composeStyles(
  themeClass,
  style({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    width: '100%',
    top: '0',
    left: '0',
    zIndex: 1,
    overflow: 'hidden',
  })
)

export const nav = vcn(
  style({
    display: 'none',
    position: 'relative',
    backgroundColor: vars.tabBar.backgroundColor,
    marginTop: '-1px',
    paddingTop: '1px',
    boxShadow:
      'inset 0px ' +
      calc(vars.tabBar.borderSize).negate() +
      ' 0 ' +
      vars.tabBar.borderColor,
  }),
  {
    active: style({
      display: 'flex',
    }),
  }
)

export const navTab = vcn(
  style({
    flex: '1',
    fontSize: '0.875rem',
    fontWeight: 700,
    textAlign: 'center',
    padding: '0.59375rem 0',
    color: vars.tabBar.baseFontColor,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    textDecoration: 'none',
    transition: 'color 100ms',
    outline: 'none',
  }),
  {
    active: style({
      color: vars.tabBar.activeFontColor,
    }),
  }
)

export const indicator = style({
  position: 'absolute',
  bottom: '0',
  left: '0',
  height: '2px',
  backgroundColor: vars.tabBar.indicator.color,
  willChange: 'transform',
  transition: 'transform 300ms',
  width: vars.tabBar.indicator.width,
  transform: vars.tabBar.indicator.transform,
})

export const mains = style({
  display: 'flex',
  flex: '1',
  overflow: 'hidden',
  willChange: 'transform',
  transition: 'transform 300ms',
  width: vars.tabMain.width,
  transform: vars.tabMain.transform,
})

export const main = vcn(
  style({
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: vars.tabMain.backgroundColor,
    position: 'relative',
    visibility: 'hidden',
    transition: 'visibility 0s 300ms',
  }),
  {
    active: style({
      visibility: 'visible',
      transition: 'visibility 0s 0s',
    }),
  }
)

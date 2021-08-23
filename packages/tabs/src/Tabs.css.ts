import { vcn } from 'vanilla-classnames'

import { composeStyles, createTheme, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'

const [themeClass, vars] = createTheme({
  tabBarBackgroundColor: '#fff',
  tabBarBorderColor: 'rgba(0, 0, 0, 0.07)',
  tabBarBorderSize: '1px',
  tabBarBaseFontColor: '$gray500',
  tabBarActiveFontColor: '$gray900',
  tabBarIndicatorColor: '$gray900',
  tabMainBackgroundColor: '#fff',
})

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
    backgroundColor: vars.tabBarBackgroundColor,
    marginTop: '-1px',
    paddingTop: '1px',
    boxShadow:
      'inset 0px ' +
      calc(vars.tabBarBorderSize).negate() +
      ' 0 ' +
      vars.tabBarBorderColor,
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
    color: vars.tabBarBaseFontColor,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    textDecoration: 'none',
    transition: 'color 100ms',
    outline: 'none',
  }),
  {
    active: style({
      color: vars.tabBarActiveFontColor,
    }),
  }
)

export const indicator = style({
  position: 'absolute',
  bottom: '0',
  left: '0',
  height: '2px',
  backgroundColor: vars.tabBarIndicatorColor,
  transition: 'transform 300ms',
  willChange: 'transform',
  // width: ${(props) => 100 / props.tabCount}%;
  // transform: translateX(${(props) => props.position * 100 + '%'});
})

export const mains = style({
  display: 'flex',
  flex: '1',
  overflow: 'hidden',
  transition: 'transform 300ms',
  willChange: 'transform',
})

export const main = vcn(
  style({
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: vars.tabMainBackgroundColor,
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

import {
  createTheme,
  style,
  StyleRule,
  styleVariants,
} from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { recipe } from '@vanilla-extract/recipes'

const [themeClass, vars] = createTheme({
  tabBar: {
    backgroundColor: '#fff',
    borderColor: 'rgba(0, 0, 0, 0.07)',
    borderSize: '1px',
    baseFontColor: '#ADB1BA',
    activeFontColor: '#212124',
    fontSize: '0.875rem',
    fontWeight: '700',
    inset: '0',
    indicator: {
      color: '#212124',
      width: '',
      transform: '',
      display: '',
    },
    item: {
      verticalPadding: '0.59375rem',
      inlineHorizontalPadding: '0.875rem',
      inlineGap: '0.5rem',
    },
  },
  tabMain: {
    backgroundColor: '#fff',
    width: '',
    transform: '',
  },
  transitionDuration: '300ms',
})

export { vars }

export const container = style([
  themeClass,
  {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
  },
])

export const tabBar = recipe({
  base: {
    display: 'flex',
    position: 'relative',
    backgroundColor: vars.tabBar.backgroundColor,
    marginTop: '-1px',
    paddingTop: '1px',
    boxShadow:
      'inset 0px ' +
      calc(vars.tabBar.borderSize).negate() +
      ' 0 ' +
      vars.tabBar.borderColor,
  },
  variants: {
    scrollable: {
      true: {
        display: 'block',
        padding: `1px ${vars.tabBar.inset} 0`,
        overflowX: 'scroll',
        whiteSpace: 'nowrap',
        selectors: {
          ['&::-webkit-scrollbar']: {
            display: 'none',
          },
        },
      },
    },
  },
})

export const tabBarItem = recipe({
  base: {
    flex: '1',
    fontSize: vars.tabBar.fontSize,
    fontWeight: vars.tabBar.fontWeight,
    textAlign: 'center',
    color: vars.tabBar.baseFontColor,
    padding: `${vars.tabBar.item.verticalPadding} 0`,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    textDecoration: 'none',
    transition: 'color 100ms',
    outline: 'none',
  },
  variants: {
    active: {
      true: {
        color: vars.tabBar.activeFontColor,
      },
    },
    scrollable: {
      true: {
        display: 'inline-block',
        verticalAlign: 'top',
        padding: `${vars.tabBar.item.verticalPadding} ${vars.tabBar.item.inlineHorizontalPadding}`,
        marginRight: vars.tabBar.item.inlineGap,
      },
    },
  },
})

export const tabBarIndicator = style({
  display: vars.tabBar.indicator.display,
  position: 'absolute',
  bottom: '0',
  left: '0',
  height: '2px',
  backgroundColor: vars.tabBar.indicator.color,
  willChange: 'transform',
  transition: `transform ${vars.transitionDuration}`,
  width: vars.tabBar.indicator.width,
  transform: vars.tabBar.indicator.transform,
  transformOrigin: 'top left',
})

export const tabMains = style({
  display: 'flex',
  flex: '1',
  overflow: 'hidden',
  willChange: 'transform',
  transition: `transform ${vars.transitionDuration}`,
  width: vars.tabMain.width,
  transform: vars.tabMain.transform,
})

const _tabMain: StyleRule = {
  flex: '1',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  backgroundColor: vars.tabMain.backgroundColor,
  position: 'relative',
  visibility: 'hidden',
  transition: `visibility 0s ${vars.transitionDuration}`,
}
export const tabMain = styleVariants({
  hidden: {
    ..._tabMain,
  },
  active: {
    ..._tabMain,
    visibility: 'visible',
    transition: 'visibility 0s 0s',
  },
})

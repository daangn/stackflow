import { vcn } from 'vanilla-classnames'

import { style } from '@vanilla-extract/css'

import { vars } from '../theme.css'

export const container = style({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
})
export const container_enterActive = style({
  display: 'block',
})
export const container_enterDone = style({
  display: 'block',
})
export const container_exitActive = style({
  display: 'block',
})
export const container_exitDone = style({
  display: 'block',
})

export const dim = vcn(
  style({
    backgroundColor: vars.dimBackgroundColor,
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    willChange: 'opacity',
    selectors: {
      [`${container_enterActive} &`]: {
        opacity: 1,
      },
      [`${container_enterDone} &`]: {
        opacity: 1,
      },
      [`${container_exitActive} &`]: {
        opacity: 0,
      },
      [`${container_exitDone} &`]: {
        opacity: 0,
      },
    },
  }),
  {
    cupertinoAndIsNavbarVisible: style({
      top: '2.75rem',
    }),
    cupertinoAndIsPresent: style({
      top: 0,
    }),
    android: style({
      height: '10rem',
      background: `linear-gradient(${vars.dimBackgroundColor}, rgba(0, 0, 0, 0))`,
    }),
  }
)

export const mainOffset = vcn(
  style({
    width: '100%',
    height: '100%',
    willChange: 'transform',
  }),
  {
    androidAndIsNotTop: style({
      transform: 'translateY(-2rem)',
    }),
  }
)

export const main = vcn(
  style({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  }),
  {
    cupertinoAndIsPresent: style({
      transform: 'translateY(100%)',
      willChange: 'transform',
      selectors: {
        [`${container_enterActive} &`]: {
          transform: 'translateY(0)',
        },
        [`${container_enterDone} &`]: {
          transform: 'translateY(0)',
        },
        [`${container_exitActive} &`]: {
          transform: 'translateY(100%)',
        },
        [`${container_exitDone} &`]: {
          transform: 'translateY(100%)',
        },
      },
    }),
    cupertinoAndIsNavbarVisible: style({
      paddingTop: 'calc(2.75rem + env(safe-area-inset-top))',
    }),
    android: style({
      opacity: 0,
      transform: 'translateY(10rem)',
      transitionTimingFunction: 'cubic-bezier(0.22, 0.67, 0.39, 0.83)',
      willChange: 'transform, opacity',
      selectors: {
        [`${container_enterActive} &`]: {
          opacity: 1,
          transform: 'translateY(0)',
        },
        [`${container_enterDone} &`]: {
          opacity: 1,
          transform: 'translateY(0)',
        },
        [`${container_exitActive} &`]: {
          opacity: 0,
          transform: 'translateY(10rem)',
        },
        [`${container_exitDone} &`]: {
          opacity: 0,
          transform: 'translateY(10rem)',
        },
      },
    }),
    androidAndIsNavbarVisible: style({
      paddingTop: '3.5rem',
    }),
    androidAndIsRoot: style({
      opacity: 0,
      transform: 'translateY(0)',
    }),
  }
)

export const frameOffset = vcn(
  style({
    width: '100%',
    height: '100%',
    willChange: 'transition',
  }),
  {
    cupertinoAndIsNotPresent: style({
      selectors: {
        [`${container_exitActive} &`]: {
          transform: 'translateX(0)',
        },
        [`${container_exitDone} &`]: {
          transform: 'translateX(0)',
        },
      },
    }),
    cupertinoAndIsNotTop: style({
      transform: 'translateX(-5rem)',
    }),
  }
)

export const frame = vcn(
  style({
    width: '100%',
    height: '100%',
    overflowY: 'scroll',
    scrollBehavior: 'smooth',
    backgroundColor: vars.backgroundColor,
    WebkitOverflowScrolling: 'touch',
  }),
  {
    cupertino: style({
      transform: 'translateX(0)',
      willChange: 'transform',
    }),
    cupertinoAndIsNotRoot: style({
      transform: 'translateX(100%)',
    }),
    cupertinoAndIsPresent: style({
      transform: 'translateX(0)',
    }),
    cupertinoAndIsNotPresent: style({
      selectors: {
        [`${container_enterActive} &`]: {
          transform: 'translateX(0)',
        },
        [`${container_enterDone} &`]: {
          transform: 'translateX(0)',
        },
        [`${container_exitActive} &`]: {
          transform: 'translateX(100%)',
        },
        [`${container_exitDone} &`]: {
          transform: 'translateX(100%)',
        },
      },
    }),
  }
)

export const edge = vcn(
  style({
    position: 'absolute',
    left: 0,
    height: '100%',
    width: '1.25rem',
  }),
  {
    isNavbarVisible: [
      style({
        display: 'block',
      }),
      style({
        top: 0,
      }),
    ],
    cupertinoAndIsNavbarVisible: style({
      top: '2.75rem',
    }),
  }
)

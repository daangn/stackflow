import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '../Navigator.css'

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

export const dim = recipe({
  base: {
    backgroundColor: vars.dimBackgroundColor,
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    willChange: 'opacity',
    transition: `opacity ${vars.animationDuration}`,
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
  },
  variants: {
    cupertinoAndIsNavbarVisible: {
      true: {
        top: [
          `calc(${vars.navbar.height} + constant(safe-area-inset-top))`,
          `calc(${vars.navbar.height} + env(safe-area-inset-top))`,
        ],
      },
    },
    cupertinoAndIsPresent: {
      true: {
        top: 0,
      },
    },
    android: {
      true: {
        height: '10rem',
        background: `linear-gradient(${vars.dimBackgroundColor}, rgba(0, 0, 0, 0))`,
      },
    },
  },
})

export const mainOffset = recipe({
  base: {
    width: '100%',
    height: '100%',
    willChange: 'transform',
    transition: `transform ${vars.animationDuration}`,
  },
  variants: {
    androidAndNoAnimate: {
      true: {
        transform: 'none',
      },
    },
    androidAndIsNotTop: {
      true: {
        transform: 'translateY(-2rem)',
      },
    },
  },
})

export const main = recipe({
  base: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    transition: `padding-top ${vars.navbar.animationDuration} ease-in-out`,
  },
  variants: {
    cupertinoAndIsPresent: {
      true: {
        transform: 'translateY(100%)',
        willChange: 'transform',
        transition: `padding-top ${vars.navbar.animationDuration} ease-in-out, transform ${vars.animationDuration}`,
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
      },
    },
    cupertinoAndIsNavbarVisible: {
      true: {
        paddingTop: [
          `calc(${vars.navbar.height} + constant(safe-area-inset-top))`,
          `calc(${vars.navbar.height} + env(safe-area-inset-top))`,
        ],
      },
    },
    androidAndNoAnimate: {
      true: {
        opacity: 'none',
        transform: 'none',
      },
    },
    androidAndNoAnimateAndIsNavbarVisible: {
      true: {
        opacity: 'none',
        transform: 'none',
        paddingTop: vars.navbar.height,
      },
    },
    android: {
      true: {
        opacity: 0,
        transform: 'translateY(10rem)',
        transitionTimingFunction: 'cubic-bezier(0.22, 0.67, 0.39, 0.83)',
        willChange: 'transform, opacity',
        transition: `transform ${vars.animationDuration}, opacity ${vars.animationDuration}, padding-top ${vars.navbar.animationDuration} ease-in-out`,
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
      },
    },
    androidAndIsNavbarVisible: {
      true: {
        paddingTop: vars.navbar.height,
      },
    },
    androidAndIsRoot: {
      true: {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
    isTopAndIsNavbarNotVisible: {
      true: {
        backgroundColor: '#fff',
      },
    },
  },
})

export const frameOffset = recipe({
  base: {
    width: '100%',
    height: '100%',
    willChange: 'transform',
    transition: `transform ${vars.animationDuration}`,
  },
  variants: {
    noAnimate: {
      true: {
        transform: 'none',
      },
    },
    cupertinoAndIsNotPresent: {
      true: {
        selectors: {
          [`${container_exitActive} &`]: {
            transform: 'translateX(0)',
          },
          [`${container_exitDone} &`]: {
            transform: 'translateX(0)',
          },
        },
      },
    },
    cupertinoAndIsNotTop: {
      true: {
        transform: 'translateX(-5rem)',
      },
    },
  },
})

export const frame = recipe({
  base: {
    width: '100%',
    height: '100%',
    overflowY: 'scroll',
    scrollBehavior: 'smooth',
    backgroundColor: vars.backgroundColor,
    WebkitOverflowScrolling: 'touch',
  },
  variants: {
    noAnimate: {
      true: {
        transform: 'none',
      },
    },
    cupertino: {
      true: {
        transform: 'translateX(0)',
        willChange: 'transform',
        transition: `transform ${vars.animationDuration}`,
      },
    },
    cupertinoAndIsNotRoot: {
      true: {
        transform: 'translateX(100%)',
      },
    },
    cupertinoAndIsPresent: {
      true: {
        transform: 'translateX(0)',
      },
    },
    cupertinoAndIsNotPresent: {
      true: {
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
      },
    },
    hidden: {
      true: {
        display: 'none',
      },
    },
  },
})

export const edge = recipe({
  base: {
    position: 'absolute',
    left: 0,
    height: '100%',
    width: '1.25rem',
    top: 0,
  },
  variants: {
    isNavbarVisible: {
      true: {
        display: 'block',
      },
    },
    cupertinoAndIsNavbarVisible: {
      true: {
        top: '2.75rem',
      },
    },
  },
})

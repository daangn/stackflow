import { vcn } from 'vanilla-classnames'

import { style } from '@vanilla-extract/css'

export const cardTransitionNode_enterActive = style({
  display: 'block',
})
export const cardTransitionNode_enterDone = style({
  display: 'block',
})
export const cardTransitionNode_exitActive = style({
  display: 'block',
})
export const cardTransitionNode_exitDone = style({
  display: 'block',
})

export const cardTransitionNode = style({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
})

export const cardDim = vcn(
  style({
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    willChange: 'opacity',
    selectors: {
      [`${cardTransitionNode_enterActive} &`]: {
        opacity: 1,
      },
      [`${cardTransitionNode_enterDone} &`]: {
        opacity: 1,
      },
      [`${cardTransitionNode_exitActive} &`]: {
        opacity: 0,
      },
      [`${cardTransitionNode_exitDone} &`]: {
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
      background: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0))',
    }),
  }
)

export const cardMainOffset = vcn(
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

export const cardMain = vcn(
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
        [`${cardTransitionNode_enterActive} &`]: {
          transform: 'translateY(0)',
        },
        [`${cardTransitionNode_enterDone} &`]: {
          transform: 'translateY(0)',
        },
        [`${cardTransitionNode_exitActive} &`]: {
          transform: 'translateY(100%)',
        },
        [`${cardTransitionNode_exitDone} &`]: {
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
        [`${cardTransitionNode_enterActive} &`]: {
          opacity: 1,
          transform: 'translateY(0)',
        },
        [`${cardTransitionNode_enterDone} &`]: {
          opacity: 1,
          transform: 'translateY(0)',
        },
        [`${cardTransitionNode_exitActive} &`]: {
          opacity: 0,
          transform: 'translateY(10rem)',
        },
        [`${cardTransitionNode_exitDone} &`]: {
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

export const cardFrameOffset = vcn(
  style({
    width: '100%',
    height: '100%',
    willChange: 'transition',
  }),
  {
    cupertinoAndIsNotPresent: style({
      selectors: {
        [`${cardTransitionNode_exitActive} &`]: {
          transform: 'translateX(0)',
        },
        [`${cardTransitionNode_exitDone} &`]: {
          transform: 'translateX(0)',
        },
      },
    }),
    cupertinoAndIsNotTop: style({
      transform: 'translateX(-5rem)',
    }),
  }
)

export const cardFrame = vcn(
  style({
    width: '100%',
    height: '100%',
    overflowY: 'scroll',
    scrollBehavior: 'smooth',
    backgroundColor: '#fff',
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
        [`${cardTransitionNode_enterActive} &`]: {
          transform: 'translateX(0)',
        },
        [`${cardTransitionNode_enterDone} &`]: {
          transform: 'translateX(0)',
        },
        [`${cardTransitionNode_exitActive} &`]: {
          transform: 'translateX(100%)',
        },
        [`${cardTransitionNode_exitDone} &`]: {
          transform: 'translateX(100%)',
        },
      },
    }),
  }
)

export const cardEdge = vcn(
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

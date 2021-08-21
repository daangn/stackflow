import { vcn } from 'vanilla-classnames'

import { style } from '@vanilla-extract/css'

import {
  container_exitActive as cardContainer_exitActive,
  container_exitDone as cardContainer_exitDone,
} from './Card.css'

export const container = vcn(
  style({
    position: 'absolute',
    width: '100%',
    top: 0,
    padding: 'constant(safe-area-inset-top) 0 0',
    paddingTop: 'env(safe-area-inset-top)',
    backgroundColor: '#fff',
    color: '#212529',
  }),
  {
    cupertinoAndIsNotPresent: style({
      selectors: {
        [`${cardContainer_exitActive} &`]: {
          display: 'none',
        },
        [`${cardContainer_exitDone} &`]: {
          display: 'none',
        },
      },
    }),
  }
)

export const main = vcn(
  style({
    display: 'flex',
    position: 'relative',
  }),
  {
    android: style({
      height: '3.5rem',
      boxShadow: 'inset 0px -1px 0 rgba(0, 0, 0, 0.07)',
    }),
    cupertino: style({
      height: '2.75rem',
      boxShadow: 'inset 0px -0.5px 0 rgba(0, 0, 0, 0.12)',
    }),
    noBorder: style({
      boxShadow: 'none',
    }),
  }
)

export const flex = style({
  display: 'flex',
  position: 'absolute',
  left: 0,
  width: '100%',
  height: '100%',
  top: 0,
})

export const left = style({
  padding: '0 0.5rem',
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  zIndex: 1,
  ':empty': {
    display: 'none',
  },
})

export const backButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
  opacity: 1,
  transition: 'opacity 300ms',
  width: '2.25rem',
  height: '2.75rem',
  textDecoration: 'none',
  outline: 'none',
  ':active': {
    opacity: '0.2',
    transition: 'opacity 0s',
  },
})

export const right = vcn(
  style({
    padding: '0 0.5rem',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    marginLeft: 'auto',
    position: 'relative',
    zIndex: 1,
    ':empty': {
      display: 'none',
    },
  }),
  {
    android: style({
      padding: '0 0.5rem 0 0',
    }),
  }
)

export const closeButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
  opacity: '1',
  transition: 'opacity 300ms',
  width: '2.25rem',
  height: '2.75rem',
  textDecoration: 'none',
  outline: 'none',
  ':active': {
    opacity: '0.2',
    transition: 'opacity 0s',
  },
})

export const center = vcn(
  style({
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  }),
  {
    android: style({
      paddingRight: '1rem',
    }),
  }
)

export const centerMain = vcn(
  style({
    display: 'block',
  }),
  {
    android: style({
      justifyContent: 'flex-start',
      paddingLeft: '1rem',
      fontSize: '1.1875rem',
      lineHeight: '1.5',
      fontWeight: 'bold',
      width: '100%',
      boxSizing: 'border-box',
    }),
    androidAndIsLeft: style({
      paddingLeft: '0.375rem',
    }),
    cupertino: style({
      fontFamily: '-apple-system, BlinkMacSystemFont',
      textAlign: 'center',
      fontWeight: 600,
      fontSize: '1rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: '0',
      left: '50%',
      height: '100%',
      transform: 'translate(-50%)',
    }),
  }
)

export const centerMainText = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  whiteSpace: 'nowrap',
  width: '100%',
})

export const centerMainEdge = vcn(
  style({
    position: 'absolute',
    top: '0',
    left: '50%',
    height: '1.25rem',
    transform: 'translate(-50%)',
    maxWidth: '5rem',
    display: 'none',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  }),
  {
    cupertino: style({
      display: 'block',
    }),
  }
)

export const svgIcon = style({
  width: '1.5rem',
  height: '1.5rem',
})

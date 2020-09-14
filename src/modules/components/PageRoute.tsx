import React from 'react'

import { RouteContextState, RouteContext } from '../context/route'

export interface PageRouteProps {
  component?: React.ComponentType<RouteContextState<any>> | React.ComponentType<any>
  render?: (props: RouteContextState<any>) => React.ReactNode
  children?: React.ReactNode
  path?: string | string[]
  exact?: boolean
}

const PageRoute: React.FC<PageRouteProps> = ({ render, children, component }) => {
  return (
    <RouteContext.Consumer>
      {(routeProps) => {
        if (!routeProps) {
          console.warn('<PageRoute> component must be use inside a <SwipeRouter>')
          return null
        }

        return children
          ? typeof children === 'function'
            ? children(routeProps)
            : children
          : component
          ? React.createElement(component, routeProps)
          : render
          ? render(routeProps)
          : null
      }}
    </RouteContext.Consumer>
  )
}

PageRoute.displayName = 'PageRoute'

export default PageRoute

import { createContext, useContext } from 'react'
import { HashHistory } from 'history'

export interface Match<Params extends { [K in keyof Params]?: string } = {}> {
  path: string
  url: string
  params: { [key: string]: string }
  isExact: boolean
}

export interface RouteContextState<Params = any> {
  location: HashHistory['location']
  isActive: boolean
  match: Match<Params>
  currentIndex: number
  scrollBlock: boolean
}

export const RouteContext = createContext<RouteContextState>({} as any)

RouteContext.displayName = 'RouteContext'

export const useLocation = () => useContext(RouteContext).location
export const useMatch = () => useContext(RouteContext).match
export const useIsActivePage = () => useContext(RouteContext).isActive
export const useRoute = () => useContext(RouteContext)

import { Action, Location } from 'history'
import { DependencyList, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

import { parseNavigatorSearchParams } from '../helpers'

export function useHistoryPopEffect(callbacks: {
  forward: (location: Location, action: Action) => void
  backward: (location: Location, action: Action, depth: number) => void
}) {
  const location = useLocation()
  const navigationType = useNavigationType()

  const locationKeyStack = useRef<string[]>([])

  useEffect(() => {
    if (locationKeyStack.current.length > 0 || !location.search) {
      return
    }

    const navigatorSearchParams = parseNavigatorSearchParams(location.search)
    const { screenInstanceId } = navigatorSearchParams.toObject()

    if (!screenInstanceId) {
      return
    }

    locationKeyStack.current = [location.pathname + location.search]
  }, [location.search])

  useEffect(() => {
    const locationKey = location.pathname + location.search

    switch (navigationType) {
      case 'POP': {
        const ptr = locationKeyStack.current.findIndex(
          (key) => key === locationKey
        )
        if (ptr > -1) {
          const depth = locationKeyStack.current.length - ptr
          locationKeyStack.current = locationKeyStack.current.filter(
            (_, idx) => idx <= ptr
          )
          callbacks.backward?.(location, navigationType, depth)
        } else {
          locationKeyStack.current.push(locationKey)
          callbacks.forward?.(location, navigationType)
        }
        break
      }
      case 'PUSH': {
        if (
          locationKeyStack.current[locationKeyStack.current.length - 1] !==
          locationKey
        ) {
          locationKeyStack.current.push(locationKey)
        }
        break
      }
      case 'REPLACE': {
        locationKeyStack.current[locationKeyStack.current.length - 1] =
          locationKey
        break
      }
    }
  }, [location])
}

export function useHistoryPushEffect(
  callback: (location: Location, action: Action) => void,
  deps?: DependencyList | undefined
) {
  const location = useLocation()
  const navigationType = useNavigationType()

  const locationKeyStack = useRef<string[]>([])

  const currentDeps = useMemo(() => deps || [], deps)

  useEffect(() => {
    locationKeyStack.current = [location.pathname + location.search]
  }, [])

  useEffect(() => {
    const locationKey = location.pathname + location.search

    switch (navigationType) {
      case 'PUSH': {
        if (
          locationKeyStack.current[locationKeyStack.current.length - 1] !==
          locationKey
        ) {
          locationKeyStack.current.push(locationKey)
          callback(location, navigationType)
        }
        break
      }
      case 'REPLACE': {
        locationKeyStack.current[locationKeyStack.current.length - 1] =
          locationKey
        break
      }
      case 'POP': {
        const ptr = locationKeyStack.current.findIndex(
          (key) => key === locationKey
        )
        if (ptr > -1) {
          locationKeyStack.current = locationKeyStack.current.filter(
            (_, idx) => idx <= ptr
          )
        } else {
          locationKeyStack.current.push(locationKey)
        }
      }
    }
  }, [...currentDeps, location, navigationType])
}

export function useHistoryReplaceEffect(
  callback: (location: Location, action: Action) => void,
  deps?: DependencyList | undefined
) {
  const currentDeps = useMemo(() => deps || [], deps)
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'REPLACE') {
      callback(location, navigationType)
    }
  }, [...currentDeps, location, navigationType])
}

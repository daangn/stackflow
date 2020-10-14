import { DependencyList, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Location, Action, History } from 'history'

export function useHistoryPopEffect(
  callbacks: {
    forward: (location: Location<History.UnknownFacade>, action: Action) => void
    backward: (location: Location<History.UnknownFacade>, action: Action) => void
  },
  deps?: DependencyList | undefined
) {
  const history = useHistory()
  const [locationKeys, setLocationKeys] = useState<string[]>([])

  useEffect(() => {
    const unlisten = history.listen((location, action) => {
      const key = location.pathname + location.search

      switch (action) {
        case 'PUSH': {
          setLocationKeys([key])
          return
        }
        case 'POP': {
          if (locationKeys[1] === key) {
            setLocationKeys(([, ...keys]) => keys)
            callbacks.forward?.(location, action)
          } else {
            setLocationKeys((keys) => [key, ...keys])
            callbacks.backward?.(location, action)
          }
          return
        }
      }
    })

    return () => {
      unlisten()
    }
  }, [locationKeys, ...(deps ?? [])])
}

export function useHistoryPushEffect(
  callback: (location: Location<History.UnknownFacade>, action: Action) => void,
  deps?: DependencyList | undefined
) {
  const history = useHistory()

  useEffect(() => {
    return history.listen((location, action) => {
      if (action === 'PUSH') {
        callback(location, action)
      }
    })
  }, deps)
}

export function useHistoryReplaceEffect(
  callback: (location: Location<History.UnknownFacade>, action: Action) => void,
  deps?: DependencyList | undefined
) {
  const history = useHistory()

  useEffect(() => {
    return history.listen((location, action) => {
      if (action === 'REPLACE') {
        callback(location, action)
      }
    })
  }, deps)
}

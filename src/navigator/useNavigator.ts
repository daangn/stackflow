import { useHistory } from 'react-router-dom'

import { appendSearch, generateScreenInstanceId } from '../utils'
import { useScreenInstanceInfo } from './contexts'
import store from './store'

export function useNavigator() {
  const history = useHistory()
  const screenInfo = useScreenInstanceInfo()

  return {
    push<T = object>(to: string) {
      return new Promise<T | null>((resolve) => {
        const [pathname, search] = to.split('?')
        const _si = generateScreenInstanceId()

        history.push(
          pathname +
            '?' +
            appendSearch(search || null, {
              _si,
            })
        )

        store.screenInstancePromises.set(screenInfo.screenInstanceId, resolve)
      })
    },
    replace(to: string) {
      const [pathname, search] = to.split('?')
      const _si = generateScreenInstanceId()

      history.replace(
        pathname +
          '?' +
          appendSearch(search, {
            _si,
          })
      )
    },
    pop(depth = 1) {
      const targetScreenInstance = store.screenInstances[store.screenInstancePointer - depth]
      const nestedRouteCounts = store.screenInstances.map(({ nestedRouteCount }) => nestedRouteCount)
      const totalCount = nestedRouteCounts
        .filter((_, i) => i > store.screenInstancePointer - depth && i <= store.screenInstancePointer)
        .reduce((acc, current) => {
          return acc + current + 1
        }, 0)

      history.go(-totalCount)

      return {
        send<T = object>(data: T) {
          if (targetScreenInstance) {
            store.screenInstancePromises.get(targetScreenInstance.id)?.(data ?? null)
          }
        },
      }
    },
  }
}

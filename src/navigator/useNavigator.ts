import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'

import { appendSearch, generateScreenInstanceId } from '../utils'
import { AtomScreenInstances, AtomScreenInstancePointer, screenInstancePromises } from './atoms'
import { useScreenInstanceInfo } from './contexts'

export function useNavigator() {
  const history = useHistory()
  const screenInfo = useScreenInstanceInfo()

  const [screenInstances] = useRecoilState(AtomScreenInstances)
  const [screenInstancePointer] = useRecoilState(AtomScreenInstancePointer)

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

        screenInstancePromises[screenInfo.screenInstanceId] = resolve
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
      const nestedRouteCounts = screenInstances.map(({ nestedRouteCount }) => nestedRouteCount)
      const totalCount = nestedRouteCounts
        .filter((_, i) => i > screenInstancePointer - depth && i <= screenInstancePointer)
        .reduce((acc, current) => {
          return acc + current + 1
        }, 0)

      ;(async () => {
        for (let i = 0; i < totalCount; i++) {
          console.log('pop')
          history.goBack()
          // await delay(50)
        }
      })()

      return {
        send<T = object>(data: T) {
          const targetScreenInstance = screenInstances.find((_, index) => index === screenInstancePointer - depth)

          if (targetScreenInstance) {
            screenInstancePromises[targetScreenInstance.id]?.(data ?? null)
          }
        },
      }
    },
  }
}

// function delay(ms: number) {
//   return new Promise((resolve) => {
//     setTimeout(() => resolve(), ms)
//   })
// }

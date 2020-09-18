import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import short from 'short-uuid'

import { appendSearch } from '../utils/appendSearch'
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
        const kf_sid = short.generate().substr(0, 5)

        history.push(
          pathname +
            '?' +
            appendSearch(search || null, {
              kf_sid,
            })
        )

        screenInstancePromises[screenInfo.screenInstanceId] = resolve
      })
    },
    replace(to: string) {
      const [pathname, search] = to.split('?')
      const kf_sid = short.generate().substr(0, 5)

      history.replace(
        pathname +
          '?' +
          appendSearch(search, {
            kf_sid,
          })
      )
    },
    pop(depth = 1) {
      for (let i = 0; i < depth; i++) {
        history.goBack()
      }

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

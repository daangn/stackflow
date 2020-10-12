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

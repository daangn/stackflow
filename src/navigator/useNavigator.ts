import qs from 'qs'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import short from 'short-uuid'

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
        screenInstancePromises[screenInfo.screenInstanceId] = resolve

        const sid = short.generate().substr(0, 5)

        const pathname = to.split('?')[0]
        let search = to.split('?')[1]
        const parsedSearch = search ? qs.parse(search) : null

        search = qs.stringify({
          ...parsedSearch,
          kf_sid: sid,
        })

        history.push(pathname + '?' + search)
      })
    },
    replace(to: string) {
      const sid = short.generate().substr(0, 5)

      const pathname = to.split('?')[0]
      let search = to.split('?')[1]
      const parsedSearch = search ? qs.parse(search) : null

      search = qs.stringify({
        ...parsedSearch,
        kf_sid: sid,
      })

      history.replace(pathname + '?' + search)
    },
    pop<T = object>(depth: number, data?: T) {
      const targetScreenInstance = screenInstances.find((_, index) => index === screenInstancePointer - depth)

      if (targetScreenInstance) {
        screenInstancePromises[targetScreenInstance.id]?.(data ?? null)
      }

      for (let i = 0; i < depth; i++) {
        history.goBack()
      }
    },
  }
}

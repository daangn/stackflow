import { useHistory } from "react-router-dom"
import { useRecoilState } from "recoil"
import { AtomScreenInstancePointer } from "./atoms/ScreenInstancePointer"
import { AtomScreenInstances } from "./atoms/ScreenInstances"
import short from 'short-uuid'
import qs from 'qs'
import { useScreenInfo } from "./contexts/ContextScreenInfo"
import { promises } from "./promises"

export function useNavigator() {
  const history = useHistory()
  const screenInfo = useScreenInfo()

  const [screenInstances] = useRecoilState(AtomScreenInstances)
  const [screenInstancePointer] = useRecoilState(AtomScreenInstancePointer)

  return {
    push(to: string) {
      return new Promise<object | null>((resolve) => {
        promises[screenInfo.screenInstanceId] = resolve

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
    pop(level: number, data: object) {
      const targetScreenInstance = screenInstances.find((_, index) => index === screenInstancePointer - level)

      if (targetScreenInstance) {
        promises[targetScreenInstance.id]?.(data)
      }

      for (let i = 0; i < level; i++) {
        history.goBack()
      }
    },
  }
}
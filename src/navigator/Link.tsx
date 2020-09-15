import React, { useMemo } from 'react'
import short from 'short-uuid'
import { Link as RouterLink } from 'react-router-dom'
import qs from 'qs'

interface LinkProps {
  to: string
  replace?: boolean
}
const Link: React.FC<LinkProps> = (props) => {
  const pathname = props.to.split('?')[0]
  let search = props.to.split('?')[1]

  /**
   * 다음 화면의 StackInstance.id를 생성합니다
   */
  const sid = useMemo(() => short.generate().substr(0, 8), [])

  if (search) {
    const parsedSearch = qs.parse(search)
    search = qs.stringify({
      ...parsedSearch,
      kf_sid: sid,
    })
  } else {
    search = qs.stringify({
      kf_sid: sid,
    })
  }

  return (
    <RouterLink to={{
      pathname,
      search
    }} replace={props.replace}>
      {props.children}
    </RouterLink>
  )
}

export default Link

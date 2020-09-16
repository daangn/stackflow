import qs from 'qs'
import React, { forwardRef, useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import short from 'short-uuid'

interface LinkProps {
  to: string
  replace?: boolean
  className?: string
}
const Link: React.FC<LinkProps> = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  /**
   * 다음 화면의 ScreenInstance.id를 생성합니다
   */
  const sid = useMemo(() => short.generate().substr(0, 5), [])

  const pathname = props.to.split('?')[0]
  let search = props.to.split('?')[1]
  const parsedSearch = search ? qs.parse(search) : null

  search = qs.stringify({
    ...parsedSearch,
    kf_sid: sid,
  })

  return (
    <RouterLink
      ref={ref}
      to={{
        pathname,
        search,
      }}
      replace={props.replace}
      className={props.className}>
      {props.children}
    </RouterLink>
  )
})

export default Link

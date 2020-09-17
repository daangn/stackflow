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
  const { pathname, search } = useMemo(() => {
    const sid = () => short.generate().substr(0, 5)

    const [pathname, search] = props.to.split('?')
    const parsedSearch = search ? qs.parse(search) : null
    return {
      pathname,
      search: qs.stringify({ ...parsedSearch, kf_sid: sid }),
    }
  }, [props.to])

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

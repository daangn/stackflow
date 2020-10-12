import React, { forwardRef, useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import short from 'short-uuid'

import { appendSearch } from '../utils'

interface LinkProps {
  /**
   * 이동할 path
   */
  to: string

  /**
   * path 이동을 replace로 처리할 지 여부
   */
  replace?: boolean

  /**
   * className
   */
  className?: string
}
const Link: React.FC<LinkProps> = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { pathname, search } = useMemo(() => {
    const [pathname, search] = props.to.split('?')
    const _si = short.generate().substr(0, 5)

    return {
      pathname,
      search: appendSearch(search || null, {
        _si,
      }),
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

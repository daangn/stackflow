import React, { forwardRef, useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { appendSearch, generateScreenInstanceId } from '../utils'

interface LinkProps {
  /**
   * 이동할 path
   */
  to: string

  /**
   * className
   */
  className?: string

  /**
   * path 이동을 replace로 처리할 지 여부
   */
  replace?: boolean

  /**
   * present 방식으로 띄우기 (replace와 함께 쓸 수 없음)
   */
  present?: boolean
}
const Link: React.FC<LinkProps> = forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => {
    const { pathname, search } = useMemo(() => {
      const [pathname, search] = props.to.split('?')
      const _si = generateScreenInstanceId()

      const params: {
        _si: string
        _present?: 'true'
      } = {
        _si,
      }

      if (props.present) {
        params._present = 'true'
      }

      return {
        pathname,
        search: appendSearch(search || null, params),
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
        className={props.className}
      >
        {props.children}
      </RouterLink>
    )
  }
)

export default Link

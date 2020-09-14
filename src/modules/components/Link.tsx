import React, { forwardRef, useCallback, MouseEvent } from 'react'
import styled from '@emotion/styled'
import { SerializedStyles } from '@emotion/core'

import { useHistory } from '../context/history'

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
  replace?: boolean
  customStyle?: SerializedStyles
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, onClick, children, ...anchorProps }: LinkProps, ref) => {
    const history = useHistory()

    const handleClickLink = useCallback(
      (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()

        onClick?.(e)
        replace ? history.replace(to) : history.push(to)
      },
      [history, onClick, replace, to]
    )

    return (
      <Anchor {...anchorProps} ref={ref} onClick={handleClickLink}>
        {children}
      </Anchor>
    )
  }
)

const Anchor = styled.a<Pick<LinkProps, 'customStyle'>>`
  color: inherit;
  text-decoration: none;

  ::after {
    color: inherit;
  }

  ${({ customStyle }) => customStyle}
`

export default Link

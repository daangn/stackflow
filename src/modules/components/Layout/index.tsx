import React, { ReactNode } from 'react'
import styled from '@emotion/styled'

import { useRoute } from '../../context/route'
import Header, { HeaderProps } from './Header'

type LayoutProps = {
  headerLeftIcon?: ReactNode
  headerRightIcon?: ReactNode
} & Pick<HeaderProps, 'title'>

const Layout: React.FC<LayoutProps> = ({ children, headerLeftIcon, headerRightIcon, title }) => {
  const { scrollBlock } = useRoute()
  return (
    <Base>
      <Header leftIcon={headerLeftIcon} rightIcon={headerRightIcon} title={title} />
      <Body scrollBlock={scrollBlock}>{children}</Body>
    </Base>
  )
}

const Base = styled.div`
  height: 100%;
  overflow: hidden;
  position: relative;
`

const Body = styled.div<{ scrollBlock: boolean }>`
  padding-top: 56px;
  height: 100%;
  box-sizing: border-box;
  overflow: ${({ scrollBlock }) => (scrollBlock ? 'hidden' : 'auto')};
`

export default Layout

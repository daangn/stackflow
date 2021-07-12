import React from 'react'
import styled from '@emotion/styled'
import { ScreenHelmet } from 'karrotframe'

const PagePush: React.FC = () => {
  return (
    <Container>
      <ScreenHelmet title="Push" />
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

export default PagePush

import React from 'react'
import styled from '@emotion/styled'
import { ScreenHelmet } from 'karrotframe'

const PageUseParams: React.FC = () => {
  return (
    <Container>
      <ScreenHelmet title="useParams" />
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

export default PageUseParams

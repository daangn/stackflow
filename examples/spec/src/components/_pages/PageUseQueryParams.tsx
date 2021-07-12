import React from 'react'
import styled from '@emotion/styled'
import { ScreenHelmet } from 'karrotframe'

const PageUseQueryParams: React.FC = () => {
  return (
    <Container>
      <ScreenHelmet title="useQueryParams" />
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

export default PageUseQueryParams

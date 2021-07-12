import React from 'react'
import styled from '@emotion/styled'
import { ScreenHelmet, useQueryParams } from 'karrotframe'

const PageUseQueryParams: React.FC = () => {
  const { hello } = useQueryParams<{ hello: 'world' }>()

  return (
    <Container>
      <ScreenHelmet title="useQueryParams" />
      hello: {hello}
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

export default PageUseQueryParams

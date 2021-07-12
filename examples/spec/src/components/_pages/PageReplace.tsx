import React from 'react'
import { ScreenHelmet } from 'karrotframe'
import styled from '@emotion/styled'

const PageReplace: React.FC = () => {
  return (
    <Container>
      <ScreenHelmet title="Replace" />
      replace
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

export default PageReplace

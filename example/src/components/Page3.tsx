import React from 'react'
import styled from '@emotion/styled'
import { useNavigator } from '@daangn/karrotframe'

const Page3: React.FC = () => {
  const navigator = useNavigator()
  const onPopClick = () => {
    navigator.pop(1)
  }

  return (
    <Container>
      <button onClick={onPopClick}>이전 페이지로</button>
    </Container>
  )
}

const Container = styled.div``

export default Page3
import React from 'react'
import styled from '@emotion/styled'
import { ScreenHelmet, useNavigator } from '@daangn/karrotframe'

const Page2: React.FC = () => {
  const navigator = useNavigator()

  const onPopClick = () => {
    navigator.pop(1)
  }
  const onPage3Click = () => {
    navigator.push('/page3')
  }

  return (
    <Container>
      <ScreenHelmet
        title='페이지2'
      />
      두번째페이지
      <button onClick={onPopClick}>홈으로 돌아가기</button>
      <button onClick={onPage3Click}>상단바가 없는 페이지3으로 가기</button>
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

export default Page2
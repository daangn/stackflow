import React, { useState } from 'react'

import { ScreenComponentProps, ScreenHelmet, useNavigator } from 'karrotframe'
import styled from '@emotion/styled'

const Home: React.FC<ScreenComponentProps> = ({ isTop, isRoot }) => {
  const navigator = useNavigator()
  const [right, setRight] = useState('')

  const onPage2Click = async () => {
    const data = await navigator.push('/page2', {
      present: true,
    })
    console.log(data)
  }

  const onAppendClick = () => {
    setRight(right + '1')
  }

  return (
    <Container>
      <ScreenHelmet
        title={'당근당근당근당근당근당근당근당근당근'}
        appendRight={right}
        // closeButtonLocation="right"
      />
      위와 같이 상단바를 Customizing 할 수 있습니다 <br />
      <button onClick={onPage2Click}>상단바가 있는 페이지2로 이동</button>
      <button onClick={onAppendClick}>append</button>
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
      스크롤테스트
      <br />
    </Container>
  )
}

const Container = styled.div`
  padding: 1rem;
`

const HamburgerIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.75rem;
`

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.75rem;
`

export default Home

import React, { useMemo, useState } from 'react'

import { ScreenComponentProps, ScreenHelmet, useNavigator } from 'karrotframe'
import styled from '@emotion/styled'

const Home: React.FC<ScreenComponentProps> = ({ isTop, isRoot }) => {
  const navigator = useNavigator()
  // console.log('HOME')
  const [right, setRight] = useState('')

  const onPage2Click = async () => {
    const data = await navigator.push('/page2', {
      present: false,
    })
    console.log(data)
  }

  const onAppendClick = () => {
    setRight(right + '11111')
  }

  return (
    <Container>
      <ScreenHelmet
        title={'ekdrmsekdmrmasklfaslkfsa'}
        appendRight={right}
        closeButtonLocation="right"
        noBorder={true}
        appendLeft={
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              window.alert(1)
            }}
          >
            qwrqwrqww
          </div>
        }
        onTopClick={() => {}}
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

export default Home

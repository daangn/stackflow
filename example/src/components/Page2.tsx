import React, { useState } from 'react'

import {
  ScreenComponentProps,
  ScreenHelmet,
  useNavigator,
  useQueryParams,
} from 'karrotframe'
import styled from '@emotion/styled'

const Page2: React.FC<ScreenComponentProps> = ({ isTop, isRoot }) => {
  const navigator = useNavigator()
  const [title, setTitle] = useState('')

  const query = useQueryParams<{ id: string }>()

  const onPopClick = () => {
    navigator.pop().send({
      hello: 'world',
    })
  }
  const onPage3Click = () => {
    navigator.push('/page3')
  }


  return (
    <Container>
      <ScreenHelmet
        title={title}
        appendLeft={
          <HamburgerIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="3.8" y1="5.2" x2="20.2" y2="5.2" stroke="#212529" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="3.8" y1="12.2" x2="20.2" y2="12.2" stroke="#212529" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="3.8" y1="19.2" x2="20.2" y2="19.2" stroke="#212529" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </HamburgerIcon>
        }
        appendRight={
          <div>{title}</div>
        }
      />
      두번째페이지
      {query?.id}
      <button onClick={onPopClick}>홈으로 돌아가기</button>
      <button onClick={onPage3Click}>상단바가 없는 페이지3으로 가기</button>
      <input type='text' value={title} onChange={(e) => {
        setTitle(e.target.value)
      }} />
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

export default Page2
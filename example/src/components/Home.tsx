import React from 'react'

import {
  ScreenComponentProps,
  ScreenHelmet,
  useNavigator,
} from '@daangn/karrotframe'
import styled from '@emotion/styled'

const Home: React.FC<ScreenComponentProps> = ({ isTop, isRoot }) => {
  const navigator = useNavigator()

  const onPage2Click = async () => {
    const data = await navigator.push('/page/hello/params_page?id=1234', {
      present: true,
    })
    console.log(data)
  }

  return (
    <Container>
      <ScreenHelmet
        title='당근알바'
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
          <SearchIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.4992 2.19995C5.91526 2.19995 2.19922 5.91599 2.19922 10.5C2.19922 15.0839 5.91526 18.8 10.4992 18.8C12.5031 18.8 14.3411 18.0898 15.7754 16.9075L20.4335 21.5656C20.746 21.8781 21.2525 21.8781 21.5649 21.5656C21.8773 21.2532 21.8773 20.7467 21.5649 20.4343L16.9067 15.7761C18.0891 14.3419 18.7992 12.5038 18.7992 10.5C18.7992 5.91599 15.0832 2.19995 10.4992 2.19995ZM3.79922 10.5C3.79922 6.79964 6.79891 3.79995 10.4992 3.79995C14.1995 3.79995 17.1992 6.79964 17.1992 10.5C17.1992 14.2003 14.1995 17.2 10.4992 17.2C6.79891 17.2 3.79922 14.2003 3.79922 10.5Z" fill="#212529"/>
            </svg>
          </SearchIcon>
        }
        closeButtonLocation='right'
      />
      위와 같이 상단바를 Customizing 할 수 있습니다 <br />
      <button
        onClick={onPage2Click}
      >
        상단바가 있는 페이지2로 이동
      </button>
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
      스크롤테스트<br />
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

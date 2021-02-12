import React, { useEffect, useState } from 'react'

import { ScreenHelmet } from 'karrotframe'
import styled from '@emotion/styled'

interface Props {}

const Page4: React.FC<Props> = () => {
  const [showNav, setShowNav] = useState(true)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setShowNav(prevState => !prevState)
    }, 5000)
    return () => clearInterval(intervalId)
  }, [])
  return (
    <Base>
      {showNav && <ScreenHelmet title="page5" />}
      <Text>{showNav ? '네비게이션바가 보여야 합니다' : '네비게이션바가 보이지 않아야 합니다.'}</Text>
    </Base>
  );
};

const Base = styled.div`

`;
const Text = styled.p`
  color: #212529;
`

export default Page4;

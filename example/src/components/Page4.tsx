import React, { useEffect, useMemo, useState } from 'react'

import { Link, useScreenParams } from '@daangn/karrotframe'
import styled from '@emotion/styled'

interface Props {}

const useGetIdOnParams = () => {
  const params = useScreenParams<{ id: string }>()
  // eslint-disable-next-line
  return useMemo(() => params?.id, [])
}

const LazyLoadedComponent: React.FC = () => {
  const id = useGetIdOnParams()

  return (
    <LazyCompBase>
      {id}
    </LazyCompBase>
  );
};

const Page4: React.FC<Props> = () => {
  const [loading, setLoading] = useState(true)

  const randomId = useMemo(() => `${Math.random()}`, [])

  useEffect(() => {
    const timerId = setTimeout(() => {
      setLoading(false)
    }, 3000)
    return () => {
      clearTimeout(timerId)
    }
  }, [])
  return (
    <Base>
      {loading ? 'Loading...' : <LazyLoadedComponent />}

      <Link to={`/page2`}>페이지 전환</Link>
      <Link replace to={`/page/${randomId}/params_page`}>페이지 전환</Link>
    </Base>
  );
};

const Base = styled.div`
a {
  margin: 40px 0 0;
  padding: 16px;
  border: 1px solid #212529;
  border-radius: 5px;
}
`;
const LazyCompBase= styled.p`
  color: #FF8A3D;
  font-weight: bold;
`

export default Page4;

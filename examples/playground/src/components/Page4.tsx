import React, { useEffect, useMemo, useState } from 'react'

import { useParams, useQueryParams } from 'karrotframe'
import styled from '@emotion/styled'

interface Props {}

const useGetIdOnParams = () => {
  const params = useParams<{ id: string }>()
  // eslint-disable-next-line
  return useMemo(() => params?.id, [])
}

const LazyLoadedComponent: React.FC = () => {
  const id = useGetIdOnParams()

  return <LazyCompBase>{id}</LazyCompBase>
}

const Page4: React.FC<Props> = () => {
  const [loading, setLoading] = useState(true)
  const query = useQueryParams()

  const randomId = useMemo(() => `${Math.random()}`, [])

  console.log(query)

  useEffect(() => {
    const timerId = setTimeout(() => {
      setLoading(false)
    }, 3000)
    return () => {
      clearTimeout(timerId)
    }
  }, [])
  return <Base>{loading ? 'Loading...' : <LazyLoadedComponent />}</Base>
}

const Base = styled.div`
  a {
    margin: 40px 0 0;
    padding: 16px;
    border: 1px solid #212529;
    border-radius: 5px;
  }
`
const LazyCompBase = styled.p`
  color: #ff8a3d;
  font-weight: bold;
`

export default Page4

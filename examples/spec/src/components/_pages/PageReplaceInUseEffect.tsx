import React, { useEffect } from 'react'
import { useNavigator } from 'karrotframe'
import styled from '@emotion/styled'

const PageReplaceInUseEffect: React.FC = () => {
  const { replace } = useNavigator()

  useEffect(() => {
    replace('/pop')
  }, [replace])

  return <Container />
}

const Container = styled.div``

export default PageReplaceInUseEffect

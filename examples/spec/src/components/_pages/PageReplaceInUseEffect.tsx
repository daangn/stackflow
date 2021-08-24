import React, { useEffect } from 'react'

import styled from '@emotion/styled'
import { useNavigator } from '@karrotframe/navigator'

const PageReplaceInUseEffect: React.FC = () => {
  const { replace } = useNavigator()

  useEffect(() => {
    replace('/pop')
  }, [replace])

  return <Container />
}

const Container = styled.div``

export default PageReplaceInUseEffect

import React from 'react'

import styled from '@emotion/styled'
import { ScreenHelmet, useNavigator } from '@karrotframe/navigator'

import ListItem from '../ListItem'

const PagePop: React.FC = () => {
  const { pop } = useNavigator()

  return (
    <Container>
      <ScreenHelmet title="Pop" />
      <ListItem
        onClick={() => {
          pop();
        }}
      >
        pop()
      </ListItem>
      <ListItem
        onClick={() => {
          pop().send({
            hello: 'world',
          })
        }}
      >
        pop() w/ send()
      </ListItem>
    </Container>
  )
}

const Container = styled.div``

export default PagePop

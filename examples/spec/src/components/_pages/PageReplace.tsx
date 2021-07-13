import React from 'react'
import { ScreenHelmet, useNavigator } from 'karrotframe'
import styled from '@emotion/styled'
import ListItem from '../ListItem'

const PageReplace: React.FC = () => {
  const { replace, push } = useNavigator()
  return (
    <Container>
      <ScreenHelmet title="Replace" />
      <ListItem
        onClick={() => {
          replace('/pop')
        }}
      >
        replace()
      </ListItem>
      <ListItem
        onClick={() => {
          replace('/pop', {
            animate: true,
          })
        }}
      >
        replace() w/ animate: true
      </ListItem>
      <ListItem
        onClick={() => {
          push('/replaceInUseEffect', {
            // present: true,
          })
        }}
      >
        replace() in useEffect
      </ListItem>
    </Container>
  )
}

const Container = styled.div``

export default PageReplace

import React from 'react'

import { ScreenComponentProps, ScreenHelmet, useNavigator } from 'karrotframe'
import styled from '@emotion/styled'
import ListItem from '../ListItem'

const PageHome: React.FC<ScreenComponentProps> = ({ isTop, isRoot }) => {
  const { push } = useNavigator()

  return (
    <Container>
      <ScreenHelmet title="Spec" />
      <ListItem
        onClick={() => {
          push('/screenHelmet')
        }}
      >
        {'<ScreenHelmet />'}
      </ListItem>
      <ListItem
        onClick={() => {
          push('/push')
        }}
      >
        push()
      </ListItem>
      <ListItem
        onClick={() => {
          push('/pop')
        }}
      >
        pop()
      </ListItem>
      <ListItem
        onClick={() => {
          push('/replace')
        }}
      >
        replace()
      </ListItem>
      <ListItem
        onClick={() => {
          push('/useParams/1234')
        }}
      >
        useParams()
      </ListItem>
      <ListItem
        onClick={() => {
          push('/useQueryParams?hello=world')
        }}
      >
        useQueryParams()
      </ListItem>
    </Container>
  )
}

const Container = styled.div``

export default PageHome

import React, { useMemo} from 'react'
import styled from '@emotion/styled'
import { ScreenHelmet, useNavigator } from '@karrotframe/navigator'

import ListItem from '../ListItem'
import { useDataDecorator } from "../../plugins/useDataDecorator";

const PageHome: React.FC = () => {
  // TODO: generic is needed to support type info
  const { push  } = useNavigator()
  const { dataFromNextPage, certainValue } = useDataDecorator();
  const result = useMemo(() => {
    return dataFromNextPage({from: '/pop'});
  }, [dataFromNextPage])
  const result2 = useMemo(() => {
    return certainValue();
  }, [certainValue])

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
      <ListItem
        onClick={() => {
          push('/tabs')
        }}
      >
        @karrotframe/tabs
      </ListItem>
      <ListItem
        onClick={() => {
          push('/pulltorefresh')
        }}
      >
        @karrotframe/pulltorefresh
      </ListItem>
      <ListItem>{result?.hello || 'no data yet'}</ListItem>
      <ListItem>{result2 || 'no data yet2'}</ListItem>
    </Container>
  )
}

const Container = styled.div``

export default PageHome

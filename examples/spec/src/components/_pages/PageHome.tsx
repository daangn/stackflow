import React, { useMemo } from 'react'
import styled from '@emotion/styled'
import { ScreenHelmet, useNavigator } from '@karrotframe/navigator'

import ListItem from '../ListItem'
import { useDataPlugin } from '@karrotframe/navigator-plugin'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons'

interface ThemeButtonProps {
  currentTheme: 'Cupertino' | 'Android'
  switchTheme: () => void
}

const ThemeButton: React.FC<ThemeButtonProps> = ({
  currentTheme,
  switchTheme,
}: ThemeButtonProps) => {
  return (
    <button
      onClick={switchTheme}
      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
    >
      <FontAwesomeIcon
        icon={currentTheme === 'Cupertino' ? faApple : faAndroid}
        size="2x"
      />
    </button>
  )
}

interface PageHomeProps extends ThemeButtonProps {}

const PageHome: React.FC<PageHomeProps> = ({
  currentTheme,
  switchTheme,
}: PageHomeProps) => {
  const { push } = useNavigator()
  const { dataFromNextPage } = useDataPlugin()
  const result = useMemo(
    () => dataFromNextPage({ from: '/pop' }),
    [dataFromNextPage]
  )

  return (
    <Container>
      <ScreenHelmet
        title="Spec"
        appendRight={
          <ThemeButton currentTheme={currentTheme} switchTheme={switchTheme} />
        }
      />
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
      <ListItem>{result?.hello || 'pending...'}</ListItem>
    </Container>
  )
}

const Container = styled.div``

export default PageHome

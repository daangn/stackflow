import React, { useState } from 'react'

import styled from '@emotion/styled'
import { ScreenHelmet, useNavigator } from '@karrotframe/navigator'

import ListItem from '../ListItem'

const PagePush: React.FC = () => {
  const { push } = useNavigator()
  const [data, setData] = useState('')

  return (
    <Container>
      <ScreenHelmet title="Push" />
      <ListItem
        onClick={() => {
          push('/pop', {
            present: true,
          })
        }}
      >
        push() w/ present: true (iOS Only)
      </ListItem>
      <ListItem
        onClick={async () => {
          const d = await push<{ hello: string }>('/pop')

          if (d) {
            setData(JSON.stringify(d))
          } else {
            setData('')
          }
        }}
      >
        await push() {data && <code>{data}</code>}
      </ListItem>
      <ListItem
        onClick={() => {
          push('/somethingnotfound')
        }}
      >
        push() to 404
      </ListItem>
    </Container>
  )
}

const Container = styled.div``

export default PagePush

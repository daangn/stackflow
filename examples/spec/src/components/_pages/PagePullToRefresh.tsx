import '@karrotframe/pulltorefresh/index.css'

import React from 'react'

import styled from '@emotion/styled'
import { ScreenHelmet } from '@karrotframe/navigator'
import { PullToRefresh } from '@karrotframe/pulltorefresh'

const PagePullToRefresh: React.FC = () => {
  return (
    <>
      <ScreenHelmet title="@karrotframe/pulltorefresh" />
      <PullToRefresh
        onPull={async (dispose) => {
          await delay(1000)
          dispose()
        }}
      >
        <ScrollEnabler />
      </PullToRefresh>
    </>
  )
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

const ScrollEnabler = styled.div`
  height: 200vh;
`

export default PagePullToRefresh

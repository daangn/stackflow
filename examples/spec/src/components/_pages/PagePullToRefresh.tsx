import '@karrotframe/pulltorefresh/index.css'

import React from 'react'

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
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
        hello
        <br />
      </PullToRefresh>
    </>
  )
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export default PagePullToRefresh

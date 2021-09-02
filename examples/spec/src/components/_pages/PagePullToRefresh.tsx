import '@karrotframe/pulltorefresh/index.css'

import React from 'react'

import { ScreenHelmet } from '@karrotframe/navigator'
import { PullToRefresh } from '@karrotframe/pulltorefresh'

const PagePullToRefresh: React.FC = () => {
  return (
    <>
      <ScreenHelmet title="@karrotframe/pulltorefresh" />
      <PullToRefresh>hello</PullToRefresh>
    </>
  )
}

export default PagePullToRefresh

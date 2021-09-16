import React, { useRef, useState } from 'react'

import styled from '@emotion/styled'
import { ScreenHelmet } from '@karrotframe/navigator'
import { Tabs } from '@karrotframe/tabs'

const PageTabs: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('63119')

  return (
    <>
      <ScreenHelmet title="@karrotframe/tabs" noBorder />
      <Tabs
        tabs={[
          {
            key: '63119',
            buttonLabel: 'Small Business',
            component() {
              return <div>Small Business</div>
            },
          },
          {
            key: '21882',
            buttonLabel: 'Food & Beverage',
            component() {
              return <div>Food & Beverage</div>
            },
          },
          {
            key: '8433',
            buttonLabel: 'Living',
            component() {
              return <div>Living</div>
            },
          },
        ]}
        activeTabKey={activeKey}
        onTabChange={(key) => {
          setActiveKey(key)
        }}
        useInlineButtons
      />
    </>
  )
}

const HorizontalScroller = styled.div`
  width: 100%;
  height: 5rem;
  overflow-x: scroll;
  background-color: red;
`

const ScrollEnabler = styled.div`
  width: 200vw;
`

export default PageTabs

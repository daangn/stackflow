import React, { useRef, useState } from 'react'

import styled from '@emotion/styled'
import { ScreenHelmet } from '@karrotframe/navigator'
import { Tabs, useTabsController } from '@karrotframe/tabs'

const PageTabs: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('tab_1')

  return (
    <>
      <ScreenHelmet title="@karrotframe/tabs" noBorder />
      <Tabs
        tabs={[
          {
            key: 'tab_1',
            buttonLabel: 'Tab 1',
            component: Tab1,
          },
          {
            key: 'tab_2',
            buttonLabel: 'Tab 2',
            component() {
              return <div>Tab 2</div>
            },
          },
          {
            key: 'tab_3',
            buttonLabel: 'Tab 3',
            component: Tab3,
          },
        ]}
        activeTabKey={activeKey}
        onTabChange={(key) => {
          setActiveKey(key)
        }}
      />
    </>
  )
}

const Tab1: React.FC = () => {
  const horizontalScrollerRef = useRef<HTMLDivElement>(null)

  return (
    <HorizontalScroller ref={horizontalScrollerRef}>
      <ScrollEnabler>Tab 1</ScrollEnabler>
    </HorizontalScroller>
  )
}

const Tab3: React.FC = () => {
  const { go, disableSwipe } = useTabsController()

  return (
    <div>
      Tab 3
      <button
        onClick={() => {
          go('tab_1')
        }}
      >
        Go to tab1
      </button>
      <button
        onClick={() => {
          disableSwipe()
        }}
      >
        Disable swipe
      </button>
    </div>
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

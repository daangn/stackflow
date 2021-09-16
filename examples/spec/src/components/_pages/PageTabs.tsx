import React, { useRef, useState } from 'react'

import styled from '@emotion/styled'
import { ScreenHelmet } from '@karrotframe/navigator'
import { Tabs, useTabsController } from '@karrotframe/tabs'

const PageTabs: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('63119')

  return (
    <>
      <ScreenHelmet title="@karrotframe/tabs" noBorder />
      <Tabs
        tabs={[
          {
            key: '63119',
            buttonLabel: '뀨에에에에엥ㅇ',
            component: Tab1,
          },
          {
            key: '21882',
            buttonLabel: '먹거리',
            component() {
              return <div>Tab 2</div>
            },
          },
          {
            key: '8433',
            buttonLabel: '생활',
            component() {
              return <div>Tab 2</div>
            },
          },
          {
            key: '52177',
            buttonLabel: '건강',
            component() {
              return <div>Tab 2</div>
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

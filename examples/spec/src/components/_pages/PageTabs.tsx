import React, { useState } from 'react'

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
            render() {
              return <div>Tab 1</div>
            },
          },
          {
            key: 'tab_2',
            buttonLabel: 'Tab 2',
            render() {
              return <div>Tab 2</div>
            },
          },
          {
            key: 'tab_3',
            buttonLabel: 'Tab 3',
            render: Tab3,
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

export default PageTabs

import React, { useState } from 'react'

import { ScreenHelmet } from '@karrotframe/navigator'
import { Tabs } from '@karrotframe/tabs'

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
        ]}
        activeTabKey={activeKey}
        onTabChange={(key) => {
          setActiveKey(key)
        }}
      />
    </>
  )
}

export default PageTabs

import React, { useState } from 'react'

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
            buttonLabel: 'Following',
            component() {
              return <div>Following</div>
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
            key: '64048',
            buttonLabel: 'Living',
            component() {
              return <div>Living</div>
            },
          },
          {
            key: '46250',
            buttonLabel: 'Health',
            component() {
              return <div>Health</div>
            },
          },
          {
            key: '44589',
            buttonLabel: 'Beauty',
            component() {
              return <div>Beauty</div>
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

export default PageTabs

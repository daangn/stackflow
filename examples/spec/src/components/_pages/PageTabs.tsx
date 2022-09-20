import React, { useState } from 'react'

import { ScreenHelmet } from '@karrotframe/navigator'
import { Tabs } from '@karrotframe/tabs'

const PageTabs: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('44589')

  return (
    <>
      <ScreenHelmet title="@karrotframe/tabs" noBorder />
      <Tabs
        tabs={[
          {
            key: '63119',
            buttonLabel: 'Following',
            render() {
              return (
                <div>
                  Following
                  <button
                    onClick={() => {
                      setActiveKey('44589')
                    }}
                  >
                    Move to Beauty
                  </button>
                </div>
              )
            },
          },
          {
            key: '21882',
            buttonLabel: 'Food & Beverage',
            render() {
              return <div>Food & Beverage</div>
            },
          },
          {
            key: '64048',
            buttonLabel: 'Living',
            render() {
              return <div>Living</div>
            },
          },
          {
            key: '46250',
            buttonLabel: 'Health',
            render() {
              return <div>Health</div>
            },
          },
          {
            key: '44589',
            buttonLabel: 'Beauty',
            render() {
              return (
                <div>
                  Beauty
                  <button
                    onClick={() => {
                      setActiveKey('63119')
                    }}
                  >
                    Move to Following
                  </button>
                </div>
              )
            },
          },
        ]}
        activeTabKey={activeKey}
        onTabChange={(key, info) => {
          setActiveKey(key)
          console.log(info)
        }}
        useInlineButtons
      />
    </>
  )
}

export default PageTabs

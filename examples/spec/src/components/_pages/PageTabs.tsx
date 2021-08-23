import React, { useState } from 'react'

import styled from '@emotion/styled'
import { ScreenHelmet } from '@karrotframe/navigator'
import { Tabs } from '@karrotframe/tabs'

const PageTabs: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('tab_1')

  return (
    <Container>
      <ScreenHelmet title="@karrotframe/tabs" noBorder />
      <Tabs
        tabs={[
          {
            key: 'tab_1',
            name: 'Tab 1',
            render() {
              return <div>Tab 1</div>
            },
          },
          {
            key: 'tab_2',
            name: 'Tab 2',
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
    </Container>
  )
}

const Container = styled.div`
  position: relative;
  height: 100%;
`

export default PageTabs

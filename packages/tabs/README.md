# `@karrotframe/tabs`

Tab UI Implementation

- Indicator with intermediate animation
- Swipeable

## Getting Started

```bash
$ yarn add @karrotframe/tabs
```

```typescript
import '@karrotframe/tabs/index.css'

import { ... } from '@karrotframe/tabs'
```

## How to use

```tsx
import { Tabs } from '@karrotframe/tabs'
import { useState } from 'react'

const App: React.FC = () => {
  const [activeTabKey, setActiveTabKey] = useState<string>('tab_1')

  return (
    <Tabs
      activeTabKey={activeTabKey}
      tabs={[
        {
          key: 'tab_1',
          buttonLabel: 'Tab 1'
          render() {
            return (
              <div>Tab 1</div>
            )
          }
        }
      ]}
      onTabChange={(key) => {
        setActiveKey(key)
      }}
    />
  )
}

export default App
```

<img src="./cover.svg" style="width: 100%;" />

<div align="center">

![](https://img.shields.io/npm/v/karrotframe)
![](https://img.shields.io/npm/l/karrotframe)
![](https://img.shields.io/npm/dt/karrotframe)

</div>

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

```tsx
import { useTabsController } from '@karrotframe/tabs'

const Something: React.FC = () => {
  const { enableSwipe, disableSwipe } = useTabsController()

  const onTouchDown = () => {
    // disable swipe when other action needed
    disableSwipe()

    // ...
  }

  return (
    // ...
  )
}
```

<img src="./cover.svg" style="width: 100%;" />

<div align="center">

![](https://img.shields.io/npm/v/@karrotframe/pulltorefresh)
![](https://img.shields.io/npm/l/@karrotframe/pulltorefresh)
![](https://img.shields.io/npm/dt/@karrotframe/pulltorefresh)

</div>

**Pull to Refresh UI for React**

---

- [Setup](#setup)
- [Components](#components)
  - [PullToRefresh](#pulltorefresh)

---

## Setup

```bash
$ yarn add @karrotframe/pulltorefresh
```

Should import the CSS of your app

```typescript
import '@karrotframe/pulltorefresh/index.css'

import { ... } from '@karrotframe/pulltorefresh'
```

## Components

### PullToRefresh

> All the props is typed and commented in TypeScript

```tsx
import { PullToRefresh } from '@karrotmarket/pulltorefresh'

const App: React.FC = () => {
  return (
    <PullToRefresh
      onPull={(dispose) => {
        refresh().then(() => {
          dispose()
        })
      }}
    >
      Hello, World
    </PullToRefresh>
  )
}

export default App
```

![cover image](./cover.png)

<div align="center">

![](https://img.shields.io/npm/v/@karrotframe/navigator)
![](https://img.shields.io/npm/l/@karrotframe/navigator)
![](https://img.shields.io/npm/dt/@karrotframe/navigator)
![](https://img.shields.io/github/contributors/daangn/karrotframe)
![](https://img.shields.io/github/last-commit/daangn/karrotframe)


</div>

## Getting Started

```bash
$ yarn add @stackflow/core
```

```tsx
import React from 'react'
import ReactDOM from 'react-dom'

import { config } from '@stackflow/core';

const { Stackflow, useFlow } = config({
  // ...
});

const App: React.FC = () => {
  return (
    <Stackflow />
  );
};

ReactDOM.render(<App />, ...)
```

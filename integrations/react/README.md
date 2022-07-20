# @stackflow/react

An integration layer for using Stackflow in React applications. Returns a `<Stack />` component for rendering the application and a `useFlow` hook for navigation.

- [Documentation](https://stackflow.so)

## Usage

```tsx
import { stackflow } from '@stackflow/react'

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [
    // ...
  ],
})

ReactDOM.render(<Stack />, ...)
```

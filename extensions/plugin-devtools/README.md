# @stackflow/plugin-devtools

Enables Stackflow Devtools (Chrome extension)

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { devtoolsPlugin } from "@stackflow/plugin-devtools";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [
    devtoolsPlugin(),
    // ...
  ],
});
```

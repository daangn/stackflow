# @stackflow/plugin-stack-depth-change

Monitors a depth change in the stack.

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { stackDepthChangePlugin } from "@stackflow/plugin-stack-depth-change";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [
    // ...
    stackDepthChangePlugin({
      /**
       * Initial loading
       * @param depth
       * @param activeActivites
       * @param activities
       */
      onInit: ({ depth, activities, activeActivities }) => {},
      /**
       * When the depth changes
       * @param depth
       * @param activeActivites
       * @param activities
       */
      onDepthChanged: ({ depth, activities, activeActivities }) => {},
    }),
  ],
});
```

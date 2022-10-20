# @stackflow/plugin-history-sync

Synchronizes the stack state with the current browser's history

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { activityDepthChangedPlugin } from "@stackflow/plugin-activity-depth-changed";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [
    // ...
    activityDepthChangePlugin({
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

# @stackflow/plugin-map-initial-activity

Map initial activity using given URL

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { mapInitialActivityPlugin } from "@stackflow/plugin-map-initial-activity";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [
    mapInitialActivityPlugin({
      mapper(url) {
        // implement mapping logic using url parameter

        return {
          activityName: "...",
          activityParams: {},
        };
      },
    }),
  ],
});
```

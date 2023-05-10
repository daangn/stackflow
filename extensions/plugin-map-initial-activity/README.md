# @stackflow/plugin-map-initial-activity

Render the activity that should be rendered by default using the stack state.

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { mapInitialActivityPlugin } from "@stackflow/plugin-map-initial-activity";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [mapInitialActivityPlugin()],
});
```

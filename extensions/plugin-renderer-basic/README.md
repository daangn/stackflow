# @stackflow/plugin-renderer-basic

Render the activity that should be rendered by default using the stack state.

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [basicRendererPlugin()],
});
```

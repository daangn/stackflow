# @stackflow/plugin-referrer

Add `referrer` activity parameter automatically

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { referrerPlugin } from "@stackflow/plugin-referrer";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [referrerPlugin()],
});
```

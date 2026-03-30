# plugin-sentry

Stackflow plugin for Sentry browser tracing. Automatically creates navigation spans for `push`, `pop`, and `replace` activity transitions.

## Setup

1. Initialize Sentry with the `stackflowBrowserTracingIntegration`:

```typescript
import * as Sentry from "@sentry/browser";
import { stackflowBrowserTracingIntegration } from "@stackflow/plugin-sentry";

Sentry.init({
  dsn: "https://xxx.ingest.us.sentry.io/xxx",
  integrations: [
    stackflowBrowserTracingIntegration(),
    // ... other integrations
  ],
});
```

2. Add `sentryPlugin()` to your stackflow configuration:

```typescript
import { stackflow } from "@stackflow/react";
import { sentryPlugin } from "@stackflow/plugin-sentry";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [
    sentryPlugin(),
    // ... other plugins
  ],
});
```

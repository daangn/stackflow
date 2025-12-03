# plugin-sentry

Add Sentry plugin for analysis tracing activity events

## Initialize


```typescript
import { stackflow } from "@stackflow/react";
import { sentryPlugin } from "@stackflow/plugin-sentry";

const { Stack, useFlow } = stackflow({
  activities: {
    // ...
  },
  plugins: [
    sentryPlugin({
      dsn: "https://xxx.ingest.us.sentry.io/xxx", // Sentry project dsn key
      // ... 
      // Additional Options for initiate Sentry
      // https://docs.sentry.io/platforms/javascript/configuration/options/
    }),
  ],
});
```
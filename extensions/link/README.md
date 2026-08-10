# @stackflow/link

It mimics the `<Link />` component behavior provided by Gatsby or Next.js.

## Dependencies

Provide a URL resolver with `LinkUrlResolverProvider`. The resolver can come
from `@stackflow/plugin-history-sync` or another routing plugin.

## Usage

Import `Link` directly from `@stackflow/link`.

```typescript
/**
 * stackflow.config.ts
 */
import { defineConfig } from "@stackflow/config";

export const config = defineConfig({
  activities: [
    {
      name: "MyActivity",
      route: "/my-activity",
    },
  ],
  transitionDuration: 350,
});
```

```typescript
/**
 * stackflow.ts
 */
import { stackflow } from "@stackflow/react";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { config } from "./stackflow.config";
import { MyActivity } from "./MyActivity";

const historySync = historySyncPlugin({
  config,
  fallbackActivity: () => "MyActivity",
});

const { Stack } = stackflow({
  config,
  components: {
    MyActivity,
  },
  plugins: [
    historySync,
    // ...
  ],
});
```

Wrap `Stack` with the resolver from the routing plugin.

```tsx
import { LinkUrlResolverProvider } from "@stackflow/link";

const App = () => (
  <LinkUrlResolverProvider resolver={historySync.urlResolver}>
    <Stack />
  </LinkUrlResolverProvider>
);
```

```tsx
/**
 * MyComponent.ts
 */
import { Link } from "@stackflow/link";

const MyComponent = () => {
  return (
    <div>
      <Link
        className={...}
        activityName="MyActivity"
        activityParams={{}}
      >
        {/* ... */}
      </Link>
    </div>
  )
}
```

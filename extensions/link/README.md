# @stackflow/link

It mimics the `<Link />` component behavior provided by Gatsby or Next.js.

## Dependencies

It can be used only when `@stackflow/plugin-history-sync` is set.

- `@stackflow/plugin-history-sync`

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

const { Stack } = stackflow({
  config,
  components: {
    MyActivity,
  },
  plugins: [
    historySyncPlugin({
      config,
      fallbackActivity: () => "MyActivity",
    }),
    // ...
  ],
});
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

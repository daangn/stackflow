# @stackflow/link

It mimics the `<Link />` component behavior provided by Gatsby or Next.js. Also, by providing `usePreloader()` hook, you can call specific preloader function imperatively at any time based on activity information.

## Dependencies

It can be used only when both `@stackflow/plugin-history-sync` and `@stackflow/plugin-preload` are set.

- `@stackflow/plugin-history-sync`
- `@stackflow/plugin-preload`

## Usage

```tsx
/**
 * stackflow.ts
 */
import { stackflow } from "@stackflow/react";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { preloadPlugin } from "@stackflow/plugin-preload";

const activities = {
  // ...
};

const { Stack, useFlow } = stackflow({
  activities,
  plugins: [
    historySyncPlugin({
      //...
    }),
    preloadPlugin({
      // ...
    }),
    // ...
  ],
});

export type TypeActivities = typeof activities;
```

```typescript
/**
 * Link.ts
 */
import { createLink } from "@stackflow/link";
import type { TypeActivities } from "./stackflow";

export const { Link, usePreloader } = createLink<TypeActivities>();
```

```tsx
/**
 * MyComponent.ts
 */
import { Link } from './Link'

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

# @stackflow/link

It mimics the `<Link />` component behavior provided by Gatsby or Next.js.

## Dependencies

It can be used only when `@stackflow/plugin-history-sync` is set.

- `@stackflow/plugin-history-sync`

## Usage

Import `Link` directly from `@stackflow/link`.

```typescript
/**
 * stackflow.ts
 */
import { stackflow } from "@stackflow/react";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";

const { Stack } = stackflow({
  config,
  components: {
    // ...
  },
  plugins: [
    historySyncPlugin({
      //...
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

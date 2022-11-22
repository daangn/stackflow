# @stackflow/plugin-preload

Preload required remote data by activity name.

- [Documentation](https://stackflow.so)

## Usage

```typescript
/**
 * stackflow.ts
 */
import { stackflow } from "@stackflow/react";
import { preloadPlugin } from "@stackflow/plugin-preload";
import { MyHome } from "./MyHome";
import { MyArticle } from "./MyArticle";
import { NotFoundPage } from "./NotFoundPage";

const { Stack, useFlow, activities } = stackflow({
  activities: {
    MyHome,
    MyArticle,
    NotFoundPage,
  },
  plugins: [
    // ...
    preloadPlugin({
      loaders: {
        MyHome({ activityParams }) {
          // implement your own preload function using activity information
          // when activity pushed, loader is automatically triggered before rendering
        },
        MyArticle() {
          // ...
        },
        NotFoundPage() {
          // ...
        },
      },
    }),
  ],
});

export type TypeActivities = typeof activities;
```

```typescript
/**
 * usePreloader.ts
 */
import { createPreloader } from "@stackflow/plugin-preload";
import type { TypeActivities } from "./stackflow";

export const { usePreloader } = createPreloader<TypeActivities>();
```

```tsx
/**
 * MyComponent.tsx
 */
import { usePreloader } from "./usePreloader";

const MyComponent = () => {
  const { preload } = usePreloader();

  useEffect(() => {
    // imperatively preload
    preload("MyArticle", {
      /* ... */
    });
  }, []);

  return <div>{/* ... */}</div>;
};
```

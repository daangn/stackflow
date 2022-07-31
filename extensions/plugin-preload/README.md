# @stackflow/plugin-preload

Preload required remote data by activity name

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { preloadPlugin } from "@stackflow/plugin-preload";
import { MyHome } from "./MyHome";
import { MyArticle } from "./MyArticle";
import { NotFoundPage } from "./NotFoundPage";

const { Stack, useFlow } = stackflow({
  activities: {
    MyHome,
    MyArticle,
    NotFoundPage,
  },
  plugins: [
    // ...
    preloadPlugin({
      loaders: {
        MyHome({ activityId, activityName }) {
          // implement your own preload function using activity information
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
```

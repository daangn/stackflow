# @stackflow/plugin-stack-depth-change

Monitors a depth change in the stack.

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { defineConfig } from "@stackflow/config";

export const config = defineConfig({
  activities: [
    {
      name: "MyHome",
    },
    {
      name: "MyArticle",
    },
  ],
  transitionDuration: 350,
});
```

```typescript
import { stackflow } from "@stackflow/react";
import { stackDepthChangePlugin } from "@stackflow/plugin-stack-depth-change";
import { config } from "./stackflow.config";
import { MyHome } from "./MyHome";
import { MyArticle } from "./MyArticle";

const { Stack } = stackflow({
  config,
  components: {
    MyHome,
    MyArticle,
  },
  plugins: [
    // ...
    stackDepthChangePlugin({
      /**
       * Initial loading
       * @param depth
       * @param activeActivities
       * @param activities
       */
      onInit: ({ depth, activities, activeActivities }) => {},
      /**
       * When the depth changes
       * @param depth
       * @param activeActivities
       * @param activities
       */
      onDepthChanged: ({ depth, activities, activeActivities }) => {},
    }),
  ],
});
```

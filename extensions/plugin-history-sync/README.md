# @stackflow/plugin-history-sync

Synchronizes the stack state with the current browser's history

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { defineConfig } from "@stackflow/config";

export const config = defineConfig({
  activities: [
    {
      name: "MyHome",
      route: "/",
    },
    {
      name: "MyArticle",
      route: "/articles/:articleId",
    },
    {
      name: "NotFoundPage",
      route: "/404",
    },
  ],
  transitionDuration: 350,
});
```

```typescript
import { stackflow } from "@stackflow/react";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { config } from "./stackflow.config";
import { MyHome } from "./MyHome";
import { MyArticle } from "./MyArticle";
import { NotFoundPage } from "./NotFoundPage";

const { Stack } = stackflow({
  config,
  components: {
    MyHome,
    MyArticle,
    NotFoundPage,
  },
  plugins: [
    // ...
    historySyncPlugin({
      config,
      /**
       * If a URL that does not correspond to the URL template is given, it moves to the `fallbackActivity`.
       */
      fallbackActivity: ({ initialContext }) => "NotFoundPage",
      /**
       * Uses the hash portion of the URL (i.e. window.location.hash)
       */
      useHash: false,
    }),
  ],
});
```

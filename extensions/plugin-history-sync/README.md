# @stackflow/plugin-history-sync

Synchronizes the stack state with the current browser's history

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from "@stackflow/react";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
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
    historySyncPlugin({
      routes: {
        /**
         * You can link the registered activity with the URL template.
         */
        MyHome: "/",
        MyArticle: "/articles/:articleId",
        NotFoundPage: "/404",
      },
      /**
       * If a URL that does not correspond to the URL template is given, it moves to the `fallbackActivity`.
       */
      fallbackActivity: ({ context }) => "NotFoundPage",
      /**
       * Uses the hash portion of the URL (i.e. window.location.hash)
       */
      useHash: false,
    }),
  ],
});
```

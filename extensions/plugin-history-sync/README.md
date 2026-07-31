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

## Reusing URL semantics

`historySyncPlugin()` exposes the URL resolver used by the plugin instance.
External features can use it to compare an Activity URL with the boot-time entry
URL without duplicating route selection, encoding, hash, or SSR rules.
When the plugin receives `config`, the same resolver is also available at
`config.historySync?.urlResolver`.

```typescript
const historySync = historySyncPlugin({
  config,
  fallbackActivity: () => "NotFoundPage",
});

const activityUrl = historySync.urlResolver.makeActivityUrl("MyArticle", {
  articleId: "42",
});
const entryUrl = historySync.urlResolver.resolveEntryUrl(initialContext);

const { Stack } = stackflow({
  config,
  components: {
    MyHome,
    MyArticle,
    NotFoundPage,
  },
  plugins: [
    // ...
    historySync,
  ],
});
```

# @stackflow/plugin-history-sync

Synchronizes the stack state with the current browser's History

- [Documentation](https://stackflow.so)

## Usage

```typescript
import { stackflow } from '@stackflow/react'
import { historySyncPlugin } from '@stackflow/plugin-history-sync'
import { MyHome } from './MyHome'
import { MyArticle } from './MyArticle'
import { NotFoundPage } from './NotFoundPage'

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
      fallbackActivity: ({ context }) => "NotFoundPage",
      useHash: false,
    })
  ],
})
```

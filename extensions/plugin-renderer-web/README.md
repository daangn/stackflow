# @stackflow/plugin-renderer-web

Render active activity only using the stack state. this plugins can be used for web application to be served on the web browser

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
import { webRendererPlugin } from "@stackflow/plugin-renderer-web";
import { config } from "./stackflow.config";
import { MyHome } from "./MyHome";
import { MyArticle } from "./MyArticle";

const { Stack } = stackflow({
  config,
  components: {
    MyHome,
    MyArticle,
  },
  plugins: [webRendererPlugin()],
});
```

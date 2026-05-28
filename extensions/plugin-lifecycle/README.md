# plugin-lifecycle

Stackflow plugin that provides `useFocusEffect`, a hook for running side-effects when an activity gains or loses focus.

## Setup

Add `lifecyclePlugin()` to your stackflow configuration:

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
import { lifecyclePlugin } from "@stackflow/plugin-lifecycle";
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
    lifecyclePlugin(),
    // ... other plugins
  ],
});
```

## Usage

`useFocusEffect` runs a callback when the activity becomes active, and an optional cleanup when it loses focus (blur), unmounts, or the callback reference changes.

```tsx
import { useFocusEffect } from "@stackflow/plugin-lifecycle";

function ArticleActivity({ articleId }) {
  useFocusEffect(() => {
    queryClient.invalidateQueries(["article", articleId]);

    return () => {
      // optional cleanup on blur
    };
  });
}
```

To re-run the effect when dependencies change, wrap the callback in `useCallback`:

```tsx
import { useCallback } from "react";
import { useFocusEffect } from "@stackflow/plugin-lifecycle";

function ArticleActivity({ articleId }) {
  useFocusEffect(
    useCallback(() => {
      const sub = subscribe(articleId);
      return () => sub.unsubscribe();
    }, [articleId]),
  );
}
```

## When to use

- **`useFocusEffect`** — External side-effects that should fire immediately on activity transition: query invalidation, analytics events, cache warming.
- **React effects** — Effects that depend on a settled React tree: DOM manipulation, scroll restoration.

The key difference is timing: `useFocusEffect` runs from the plugin's `onChanged` handler (outside the React render cycle), so it executes immediately without waiting for React's deferred rendering.

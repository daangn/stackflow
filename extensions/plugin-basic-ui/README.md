# @stackflow/plugin-basic-ui

Render the UI within the activity using the global stack state. It provides `cupertino` and `android` themes by default.

- [Documentation](https://stackflow.so)

## Usage

```typescript
/**
 * stackflow.config.ts
 */
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
/**
 * stackflow.ts
 */
import { stackflow } from "@stackflow/react";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
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
    basicUIPlugin({
      theme: "cupertino",
    }),
  ],
});
```

```tsx
import { AppScreen } from "@stackflow/plugin-basic-ui";

const Something: React.FC = () => {
  return (
    <AppScreen appBar={{ title: "Home" }}>
      <div>Hello, World</div>
    </AppScreen>
  );
};
```

```tsx
import { Modal } from "@stackflow/plugin-basic-ui";

const Something: React.FC = () => {
  return (
    <Modal>
      <div>Hello, World</div>
    </Modal>
  );
};
```

```tsx
import { BottomSheet } from "@stackflow/plugin-basic-ui";

const Something = () => {
  return (
    <BottomSheet>
      <div>Hello, World</div>
    </BottomSheet>
  );
};
```

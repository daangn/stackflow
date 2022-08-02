# @stackflow/basic-ui

Render the UI within the activity using the global stack state. It provides `cupertino` and `android` themes by default.

- [Documentation](https://stackflow.so)

## Usage

```tsx
import { AppScreen } from "@stackflow/basic-ui";

const Something: React.FC = () => {
  return (
    <AppScreen theme="cupertino" appBar={{ title: "Home" }}>
      <div>Hello, World</div>
    </AppScreen>
  );
};
```

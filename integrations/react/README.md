# @stackflow/react

An integration layer for using Stackflow in React applications. Returns a `<Stack />` component for rendering the application. Hooks such as `useFlow` are imported directly from `@stackflow/react`.

- [Documentation](https://stackflow.so)

## Usage

```tsx
import ReactDOM from "react-dom";
import { defineConfig } from "@stackflow/config";
import { stackflow, useFlow } from "@stackflow/react";
import type { ActivityComponentType } from "@stackflow/react";

declare module "@stackflow/config" {
  interface Register {
    MyActivity: {};
  }
}

const config = defineConfig({
  activities: [
    {
      name: "MyActivity",
    },
  ],
  initialActivity: () => "MyActivity",
  transitionDuration: 350,
});

const MyActivity: ActivityComponentType<"MyActivity"> = () => {
  const { push } = useFlow();

  return (
    <button onClick={() => push("MyActivity", {})}>
      Push
    </button>
  );
};

const { Stack } = stackflow({
  config,
  components: {
    MyActivity,
  },
  plugins: [
    // ...
  ],
});

ReactDOM.render(<Stack />, ...)
```

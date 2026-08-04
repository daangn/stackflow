# @stackflow/plugin-blocker

Applications sometimes need to stop users from leaving an Activity when doing so would discard work, such as changes in an unsaved form. Handling every navigation trigger separately makes this protection difficult to apply consistently.

`@stackflow/plugin-blocker` lets an active Activity decide whether to block a Stackflow navigation. When a navigation is blocked, the plugin calls `onBlocked`, where the application can either leave it blocked or call `proceed()` to retry the original navigation.

## Installation

```bash
yarn add @stackflow/plugin-blocker
```

## Setup

Add `blockerPlugin()` to your Stackflow configuration.

```tsx
import { blockerPlugin } from "@stackflow/plugin-blocker";
import { stackflow } from "@stackflow/react";
import { config } from "./stackflow.config";
import { EditProfileActivity } from "./EditProfileActivity";

export const { Stack } = stackflow({
  config,
  components: {
    EditProfileActivity,
  },
  plugins: [blockerPlugin()],
});
```

## Usage

The following Activity blocks navigation while the form has unsaved changes. Calling `proceed()` after confirmation retries the navigation that was blocked.

```tsx
import { useBlocker } from "@stackflow/plugin-blocker";
import { type FormEvent, useState } from "react";

export function EditProfileActivity() {
  const [name, setName] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useBlocker({
    shouldBlock: () => isDirty,
    onBlocked: (_navigation, { proceed }) => {
      if (window.confirm("Discard your unsaved changes?")) {
        proceed();
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDirty(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setIsDirty(true);
          }}
        />
      </label>
      <button type="submit">Save</button>
    </form>
  );
}
```

## Behavior

- `shouldBlock` can inspect `Pushed`, `Popped`, `Replaced`, `StepPushed`, `StepPopped`, and `StepReplaced` navigation actions.
- Only blockers owned by active Activities are evaluated. A blocker becomes inactive when another Activity is pushed above its Activity and becomes active again when that Activity is revealed.
- When multiple blockers block the same navigation, each blocker receives its own `proceed()`. The original navigation is retried only after every blocking blocker calls it.
- Calling the same `proceed()` more than once has no additional effect.
- A blocker is removed when the component that called `useBlocker` unmounts.
- Errors thrown by `onBlocked` are passed to the plugin's `onError` handler. An error from one blocker does not prevent other blockers from being notified.

This plugin blocks Stackflow navigation actions. It does not handle page reloads, tab closing, or navigation outside Stackflow.

## API

### `blockerPlugin()`

```typescript
function blockerPlugin(options?: {
  onError?: (error: unknown) => void;
}): StackflowReactPlugin;
```

| Option | Description |
| --- | --- |
| `onError` | Handles errors thrown by an `onBlocked` callback. Defaults to `console.error`. |

### `useBlocker()`

```typescript
function useBlocker(options: {
  shouldBlock: (action: NavigationAction) => boolean;
  onBlocked: (
    blockedNavigation: BlockedNavigation,
    actions: { proceed: () => void },
  ) => void;
}): void;
```

| Option | Description |
| --- | --- |
| `shouldBlock` | Synchronously returns whether the navigation should be blocked. |
| `onBlocked` | Runs when `shouldBlock` returns `true`. Call `proceed()` to retry the blocked navigation, or do nothing to leave it blocked. |

### `NavigationAction`

`NavigationAction` describes the navigation being evaluated. Its `name` is one of `Pushed`, `Popped`, `Replaced`, `StepPushed`, `StepPopped`, or `StepReplaced`, and its remaining fields are the parameters of that action.

### `BlockedNavigation`

```typescript
type BlockedNavigation = {
  action: NavigationAction;
};
```

The object passed to `onBlocked`. Its `action` is the `NavigationAction` that was blocked.

### `proceed()`

```typescript
function proceed(): void;
```

Retries the original navigation for the blocker that received it. It can be called after `onBlocked` returns. If multiple blockers blocked the navigation, all of their `proceed()` functions must be called before the navigation is retried.

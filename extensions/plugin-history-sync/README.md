# @stackflow/plugin-history-sync

Stackflow navigation is independent of the browser History API by default.
`@stackflow/plugin-history-sync` connects the Stackflow stack to the browser URL
and history, so browser back and forward navigation follow the same screens as
programmatic Stackflow navigation.

## Installation

```bash
yarn add @stackflow/plugin-history-sync
```

`@stackflow/plugin-history-sync@2` requires `@stackflow/core@3`.

## Setup

Define a route for each Activity and add `historySyncPlugin()` to the Stackflow
configuration.

```typescript
// stackflow.config.ts
import { defineConfig } from "@stackflow/config";

export const config = defineConfig({
  activities: [
    {
      name: "Home",
      route: "/",
    },
    {
      name: "Article",
      route: "/articles/:articleId",
    },
    {
      name: "NotFound",
      route: "/404",
    },
  ],
});
```

```tsx
// stackflow.tsx
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { stackflow } from "@stackflow/react";
import { Article } from "./Article";
import { Home } from "./Home";
import { NotFound } from "./NotFound";
import { config } from "./stackflow.config";

export const { Stack } = stackflow({
  config,
  components: {
    Home,
    Article,
    NotFound,
  },
  plugins: [
    historySyncPlugin({
      config,
      fallbackActivity: () => "NotFound",
    }),
  ],
});
```

When a fresh stack is created, the plugin selects the Activity whose route
matches the current URL. If no route matches, it uses `fallbackActivity`.

## Routes

### Path and query parameters

Named path segments become Activity parameters. Values not consumed by the
path are written as query parameters.

```typescript
{
  name: "Article",
  route: "/articles/:articleId",
}
```

Pushing `Article` with `{ articleId: "42", referrer: "home" }` produces
`/articles/42/?referrer=home`.

### Multiple paths

Use an array when more than one path should open the same Activity. More
specific routes take priority over less specific routes when the plugin matches
or creates a URL.

```typescript
{
  name: "Article",
  route: ["/articles/:articleId", "/posts/:articleId"],
}
```

### Encoding and decoding parameters

Use an object route to translate between Activity parameter values and URL
strings.

```typescript
{
  name: "Article",
  route: {
    path: "/articles/:articleId",
    encode: ({ articleId, preview }) => ({
      articleId: String(articleId),
      preview: preview ? "true" : undefined,
    }),
    decode: ({ articleId, preview }) => ({
      articleId: Number(articleId),
      preview: preview === "true",
    }),
  },
}
```

`encode` runs when Stackflow navigation produces a URL. `decode` runs when a
URL produces Activity parameters. Without these functions, URL parameters are
strings.

### Default history

`defaultHistory` inserts Activities below a directly opened Activity. This can
give deep links a useful browser-back destination.

```typescript
{
  name: "Article",
  route: {
    path: "/articles/:articleId",
    defaultHistory: (_params, { initialContext }) => [
      {
        activityName: "Home",
        activityParams: {
          locale: initialContext.locale,
        },
      },
    ],
  },
}
```

The second argument contains the Stack's `initialContext`. It is available in
`@stackflow/plugin-history-sync@1.12.0` and later. Return
`{ entries, skipDefaultHistorySetupTransition: true }` to create the default
history without the staged setup transition.

## Server-side rendering

The server cannot read `window.location`. Pass the request path through the
Stack's `initialContext` so the server and the first client render select the
same route.

```tsx
<Stack
  initialContext={{
    req: {
      path: request.url,
    },
  }}
/>
```

The same `initialContext` is passed to `fallbackActivity` and each
`defaultHistory` callback.

## Behavior

### Stack and browser history

- `push()` and `stepPush()` add browser history entries after the navigation is
  committed.
- `replace()` updates the current browser entry.
- `pop()` and `stepPop()` move back through browser history.
- Browser back and forward actions are translated into Stackflow navigation.
- Set `useHash: true` to store the Stackflow path in `window.location.hash`.

Each Activity step occupies one browser entry. Popping an Activity with
multiple steps can therefore move across more than one browser entry.

### Prevented navigation

Version 2.0.0 synchronizes the browser from committed Stackflow state. If a
plugin prevents a programmatic navigation, the URL is left unchanged. If a
plugin prevents browser back or forward navigation, the browser is reconciled
back to the committed Stackflow screen.

This makes the plugin compatible with `preventDefault`-based plugins such as
`@stackflow/plugin-blocker` without requiring additional configuration.

### Snapshot restoration

When `@stackflow/core@3` loads a snapshot, version 2.0.0 preserves the
snapshot's navigation events. It does not replace them with a new initial stack
derived from the current URL, browser state, `defaultHistory`, or
`fallbackActivity`.

URL-based initialization still applies when Stackflow creates a fresh stack.
After a snapshot is loaded, the plugin continues synchronizing browser history
from committed changes to the restored stack.

## Migrating from 1.12 to 2.0

### 1. Upgrade Core and the plugin together

```bash
yarn add @stackflow/core@^3.0.0 @stackflow/plugin-history-sync@^2.0.0
```

Version 2 uses the Core 3 initialization contract to distinguish a fresh stack
from a snapshot load. Core 2 is not supported.

### 2. Verify snapshot initialization

In version 1.12, history sync could replace snapshot events during
initialization with events reconstructed from the current URL. Version 2 keeps
the restored snapshot history instead.

If the application provides snapshots, verify the following flows after the
upgrade:

- restore a snapshot whose active Activity differs from the current URL;
- use browser back and forward across restored Activities and steps;
- reload or replace the JavaScript runtime, then continue navigation;
- handle a rejected or invalid snapshot according to the application's
  snapshot-provider policy, including fresh URL-based initialization when the
  provider recovers with a fresh stack.

### 3. Verify navigation blockers

Version 2 replaces the previous pre-navigation browser mutations with
post-commit reconciliation. Test both programmatic and browser back/forward
navigation while a blocker prevents the action, and after the user chooses to
proceed.

### 4. Keep request-specific default history

No callback change is required when upgrading from 1.12. Existing
`defaultHistory(params)` callbacks remain valid. Callbacks can optionally read
the second `{ initialContext }` argument introduced in 1.12.

## Release notes

### 2.0.0

- Requires `@stackflow/core@3`.
- Preserves snapshot navigation history during initialization.
- Synchronizes browser history from committed Stackflow state so prevented
  navigation no longer leaves the browser and stack out of sync.

### 1.12.0

- Passes `{ initialContext }` as the second argument to route
  `defaultHistory` callbacks.
- Was released with `@stackflow/core@3` as its Core peer dependency.

## API

### `historySyncPlugin()`

```typescript
function historySyncPlugin(options: {
  config: Config;
  fallbackActivity: (args: { initialContext: any }) => ActivityName;
  useHash?: boolean;
  history?: History;
  urlPatternOptions?: UrlPatternOptions;
}): StackflowReactPlugin;
```

For applications that do not use `defineConfig()`, `routes` can be supplied in
place of `config`.

| Option | Description |
| --- | --- |
| `config` | A Stackflow config whose Activity definitions contain routes. |
| `routes` | A map from Activity names to routes. Mutually exclusive with `config`. |
| `fallbackActivity` | Selects the initial Activity when no route matches the current URL. |
| `useHash` | Uses the hash portion of the URL. Defaults to `false`. |
| `history` | Supplies a custom `history` instance. Defaults to browser history in the browser and memory history on the server. |
| `urlPatternOptions` | Customizes the route pattern syntax. |

### Route object

```typescript
type Route = {
  path: string;
  decode?: (params: Record<string, string>) => ActivityParams;
  encode?: (params: ActivityParams) => Record<string, string | undefined>;
  defaultHistory?: (
    params: Record<string, string>,
    args: { initialContext: any },
  ) =>
    | HistoryEntry[]
    | {
        entries: HistoryEntry[];
        skipDefaultHistorySetupTransition?: boolean;
      };
};
```

A route can be a path string, an array of path strings, a route object, or an
array of route objects.

### Hooks

- `useRoutes()` returns the normalized Activity routes registered by the
  plugin.
- `useIsActivatedActivity()` reports whether the calling Activity is active
  after any default-history setup navigation has completed.
- `useHistoryTick()` exposes the history task queue for integrations that need
  to coordinate work with browser history updates.

### Utilities and types

The package also exports `makeTemplate`, `UrlPatternOptions`, `Route`, and
`RouteLike` for integrations that need to use the same route parsing and URL
generation behavior.

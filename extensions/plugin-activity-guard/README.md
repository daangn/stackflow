# @stackflow/plugin-activity-guard

Applications often need to redirect users away from an Activity until entry
conditions such as sign-in, onboarding, or terms acceptance are satisfied.
Implementing those checks at individual navigation call sites or inside
Activity components duplicates the policy and can apply it inconsistently.

`@stackflow/plugin-activity-guard` centralizes these entry policies as typed,
synchronous Guards. Before an Activity is pushed, replaced, or selected as the
initial Activity, a Guard can allow the requested Activity or redirect the
entry to another registered Activity before the Stack changes.

The package controls client-side navigation. It is not an authorization
boundary for protected data or server resources.

## Installation

```bash
yarn add @stackflow/plugin-activity-guard
```

The package requires `@stackflow/config` 2.x and `@stackflow/core` 3.x as peer
dependencies.

## Setup

Register the plugin with a Guard for each Activity that has an entry policy.
The Activity names and parameters are inferred from your
`@stackflow/config` registration.

```ts
// stackflow.config.ts
import { defineConfig } from "@stackflow/config";

declare module "@stackflow/config" {
  interface Register {
    Home: {};
    Checkout: { orderId: string };
    SignIn: { returnTo: string };
    Terms: { orderId: string };
  }
}

export const config = defineConfig({
  activities: [
    { name: "Home" },
    { name: "Checkout" },
    { name: "SignIn" },
    { name: "Terms" },
  ],
  initialActivity: () => "Home",
  transitionDuration: 350,
});
```

```tsx
import type { ActivityGuardFor } from "@stackflow/plugin-activity-guard";
import {
  activityGuardPlugin,
  all,
  redirect,
} from "@stackflow/plugin-activity-guard";
import { stackflow } from "@stackflow/react";
import { config } from "./stackflow.config";
import { Checkout, Home, SignIn, Terms } from "./activities";

const requireSignIn: ActivityGuardFor<"Checkout"> = ({ activityParams }) =>
  isSignedIn()
    ? true
    : redirect("SignIn", { returnTo: activityParams.orderId });

const requireTerms: ActivityGuardFor<"Checkout"> = ({ activityParams }) =>
  hasAcceptedTerms()
    ? true
    : redirect("Terms", { orderId: activityParams.orderId });

export const { Stack } = stackflow({
  config,
  components: {
    Home,
    Checkout,
    SignIn,
    Terms,
  },
  plugins: [
    activityGuardPlugin({
      guards: {
        Checkout: all(requireSignIn, requireTerms),
      },
    }),
  ],
});
```

Each Guard receives the requested `activityName` and its typed
`activityParams`. Return `true` to allow the entry, or return
`redirect(activityName, activityParams)` to replace its target. In the example,
`all()` evaluates both Guards in order and stops at the first redirect.

## Behavior and limitations

- Activities without a registered Guard are allowed.
- Redirect destinations are guarded again. Redirect chains must eventually
  reach an allowed or unguarded Activity; redirect cycles are not detected.
- Guards run synchronously. If a Guard throws, the error is propagated and the
  requested `push` or `replace` is not dispatched. An error during initial
  entry aborts Stack creation.
- A redirect preserves whether the original operation was a `push` or
  `replace`, along with its other action parameters.
- Guards run for fresh initial navigation, but not when Stackflow restores a
  snapshot. They also do not run for `pop`, Activity reactivation, or step
  navigation.
- When a fresh initial entry is redirected, later events in that initial event
  sequence are discarded.

Stackflow invokes plugins in array order. During initialization, this plugin
guards the initial events returned by earlier plugins. Place it after a plugin
that chooses the initial Activity, such as `historySyncPlugin()`, when that
plugin's destination should be guarded. For `push` and `replace`, a Guard sees
action parameters overridden by earlier plugins, and later plugins can override
the redirected target again.

## Public API

### `activityGuardPlugin(options)`

Creates the Stackflow plugin. `options.guards` is a partial map from registered
Activity names to their Guards.

```ts
interface ActivityGuardPluginOptions {
  guards: Guards;
}
```

### `ActivityGuardFor<ActivityName>`

A synchronous Guard for one registered Activity.

```ts
type ActivityGuardFor<ActivityName extends RegisteredActivityName> = (input: {
  activityName: ActivityName;
  activityParams: InferActivityParams<ActivityName>;
}) => GuardResolution;
```

`GuardResolution` is either `true` or a redirect target. Use the exported
`redirect()` helper to create a redirect resolution so that the destination
name and parameters remain type-checked.

### `all(...guards)`

Combines one or more Guards for the same Activity. It evaluates them in the
given order, returns the first redirect, and returns `true` only when every
Guard returns `true`.

### `redirect(activityName, activityParams)`

Creates a typed redirect resolution. Calling `redirect()` does not navigate by
itself; the redirect is applied only when a Guard returns the resolution.

### `resolveGuards(origin, guards)`

Resolves a target through the provided Guard map until a Guard allows it or no
Guard is registered. It returns the final `target` and `blocked`, which is
`true` when at least one redirect was followed.

The package also exports the supporting types `ActivityGuard`, `Guards`,
`GuardResolution`, `Target`, and `NonEmptyArray`.

# `@stackflow/plugin-activity-guard`

Control whether a new Stackflow Activity may be entered, or replace that Entry
with a redirect to another registered Activity.

## Setup

Add `activityGuardPlugin()` to your Stackflow plugins and register one Guard for
each Activity that has an entry policy:

```ts
import {
  activityGuardPlugin,
  and,
  or,
  redirect,
} from "@stackflow/plugin-activity-guard";

const { Stack } = stackflow({
  config,
  components,
  plugins: [
    activityGuardPlugin({
      guards: {
        ArticleEdit: and({
          guards: [
            ({ params }) =>
              isSignedIn()
                ? true
                : redirect("Login", { returnTo: params.articleId }),
            ({ params }) =>
              canEdit(params.articleId)
                ? true
                : redirect("Article", { articleId: params.articleId }),
          ],
        }),
        RestrictedPost: or({
          guards: [isAuthor, isAdmin],
          otherwise: ({ params }) =>
            redirect("Article", { articleId: params.articleId }),
        }),
      },
    }),
  ],
});
```

A Guard receives the target `activityName` and its typed `params`. Return
`true` to allow the Entry, or return `redirect(activityName, params)` to replace
the target before it enters the Stack. Redirect destinations are guarded too.

Guards run for new Activity Entries created by push, replace, or fresh initial
navigation. They do not run when an existing Activity is reactivated, when a
snapshot is loaded, or when only an Activity step changes.

`and()` evaluates Guards in declaration order and stops at the first redirect.
`or()` stops at the first `true`; when every Guard redirects, its required
`otherwise` callback chooses the common redirect.

Guards are synchronous navigation policies. A thrown error is propagated to
the caller and the target Activity is not entered. Use server-side
authorization separately for protecting data and resources.

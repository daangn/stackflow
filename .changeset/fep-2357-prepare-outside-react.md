---
"@stackflow/react": minor
---

Expose `prepare` on the `stackflow()` output to preload an activity's component chunk and data loader from outside the React render tree (e.g. at app bootstrap, before the first render), without depending on React Context.

```ts
const { Stack, actions, stepActions, prepare } = stackflow({ config, components, plugins });

prepare("Article", { articleId: "123" }); // warm chunk + fire data loader
prepare("Article");                        // warm chunk only
```

The signature matches the existing `usePrepare` hook (omitting params warms the chunk only; passing params also fires the loader), and `usePrepare` is now a thin wrapper over the same implementation, so in-tree callers are unchanged. Failures are delivered as a rejection of the returned promise rather than a synchronous throw.

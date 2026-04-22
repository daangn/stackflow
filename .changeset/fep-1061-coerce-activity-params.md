---
"@stackflow/plugin-history-sync": minor
---

Coerce activity/step params to `string | undefined` at the plugin boundary (FEP-1061).

Before this change, `push("X", { visible: true })` would store the boolean `true` in the core store while URL-arrival parsed the same URL as `{ visible: "true" }`, so `useActivityParams<K>()` returned different runtime types depending on how the user reached the activity. This PR coerces non-string values to strings inside `plugin-history-sync`'s `onBeforePush` / `onBeforeReplace` / `onBeforeStepPush` / `onBeforeStepReplace` hooks (after `encode` consumes the typed params to build the URL), and on the `decode`-path in `overrideInitialEvents`, so the core store always contains `{ [key: string]: string | undefined }`. `encode` still receives the typed params `U` from `template.fill`. Post-effect hooks (`onPushed`, `onReplaced`, `onStepPushed`, `onStepReplaced`, `onInit`) now use the new `fillWithoutEncode` to avoid re-running `encode` on already-coerced store values.

This is a behavioral change for consumers that relied on internal push preserving non-string values in the store (a pre-existing divergence from URL-arrival behavior). See the docs update for the migration note.

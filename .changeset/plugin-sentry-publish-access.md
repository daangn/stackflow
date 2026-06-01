---
"@stackflow/plugin-sentry": patch
---

Add `publishConfig: { access: "public" }` so the release workflow can publish the package.

`@stackflow/plugin-sentry` was the only package missing this field. Without it, scoped packages default to `restricted` access and `changeset publish` fails with `E402 Payment Required` (the @stackflow org has no private plan). This was masked while `0.1.0` matched the repo version (publish was skipped as "already published") and surfaced once `0.1.1` triggered an actual publish.

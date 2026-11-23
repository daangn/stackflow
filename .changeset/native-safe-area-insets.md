---
"@stackflow/plugin-basic-ui": minor
---

Read safe area insets from the `--native-safe-area-inset-*` CSS variables first, falling back to `env(safe-area-inset-*)` when they are not defined. A host app that injects these variables before the first render no longer causes a layout shift in `AppScreen`, `AppBar`, `Modal`, and `BottomSheet`.

If you set `appBar.minSafeAreaInsetTop` or its CSS variable to a cached inset to avoid that layout shift, remove the override. `AppBar` uses the larger of the two, so a stale cached value still wins over the native variable.

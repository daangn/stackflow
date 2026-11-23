---
"@stackflow/plugin-basic-ui": minor
---

Read safe area insets from the `--native-safe-area-inset-*` CSS variables first, falling back to `env(safe-area-inset-*)` when they are not defined. A host app that injects these variables on the root element before the first render, and updates them whenever the insets change, no longer causes a layout shift in `AppScreen`, `AppBar`, `Modal`, and `BottomSheet`.

If your host app injects these variables and you set `appBar.minSafeAreaInsetTop` or its CSS variable to a cached inset to avoid that layout shift, remove the override. `AppBar` uses the larger of the two, so a stale cached value still wins over the native variable. Without the native variables, `env()` can still be `0px` on the first render, so a cached override still prevents the shift there.

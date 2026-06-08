---
"@stackflow/plugin-history-sync": patch
---

Withdraw the activity and step param string coercion introduced in `1.11.0`.
Internal navigation now preserves non-string param values at runtime again, while
URL arrivals continue to use decoded URL params as before.

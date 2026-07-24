# Observe prevented actions without short-circuiting hooks

Pre-effect hooks continue in plugin order after `preventDefault()` because downstream plugins may still need to observe or transform the action. Core exposes the action-local state through `actions.isPrevented()` on every pre-effect hook so a downstream plugin can skip work that is invalid for a Prevented Action; this was chosen over stopping hook traversal, which would change established plugin ordering and blocker replay behavior.

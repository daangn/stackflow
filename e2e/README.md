# `@stackflow/plugin-history-sync` × `preventDefault` verification harness

A safety net that proves `@stackflow/plugin-history-sync` coexists correctly
with `preventDefault`-consuming plugins (`@stackflow/plugin-blocker`). It drives
a dedicated app with **both plugins applied** and asserts the one guarantee that
matters at every quiet point: **browser == stack** — the visible screen, the URL
and the public `getStack()` snapshot all agree.

The four desyncs this guards against:

1. A blocked **browser back** must keep the user in place (today the back is
   dispatched directly and cannot be vetoed).
2. A blocked **programmatic** pop/stepPop/replace must not move the browser
   (today a queued `history.back()` runs anyway).
3. A blocked **browser forward** must restore, and a following push must still
   sync exactly (today a leaked counter skips the sync).
4. The above must hold **regardless of plugin registration order**.

## Tiers

| Tier | Runner | Environment | Scope |
|---|---|---|---|
| **T1** | jest (`node`) driving real Chromium via the `playwright` library | production build served by an in-process vite preview | all real-history behaviors: the four problems, the coexistence contract, concurrency, and both plugins' navigation-observable cases |
| **T2i** | jest (`jsdom`) | both plugins applied in-process | timing-independent blocker-internal contracts (error isolation, notification order) |

Both tiers run the **current source** of the plugins (the workspace packages are
aliased to their `src`), so the harness reproduces today's behavior and will pick
up a product fix immediately.

## Running

```bash
# one-time: download the Chromium build used by T1
yarn workspace @stackflow/e2e-history-sync-blocker browser:install
#   (or set HARNESS_BROWSER_CHANNEL=chrome to use a system Chrome)

# both tiers
yarn workspace @stackflow/e2e-history-sync-blocker test:e2e

# one tier
yarn workspace @stackflow/e2e-history-sync-blocker test:t1
yarn workspace @stackflow/e2e-history-sync-blocker test:t2i

# explore the app by hand (same app the drivers use)
yarn workspace @stackflow/e2e-history-sync-blocker app:dev
```

T1 builds the app and serves it automatically (jest `globalSetup`); no separate
server step is needed.

This harness is deliberately excluded from the monorepo unit-CI sweep
(`ultra -r test` / `ultra -r typecheck`): T1 needs a real Chromium the unit
runners don't have, and the package type-checks the plugins' aliased **source**
(not this package's own code), which is not a meaningful per-package `tsc`
target. So it exposes `test:e2e` (not `test`) and no `typecheck` script — run it
explicitly with the commands above.

## Expected red on the unfixed product

This harness encodes the **target** behavior. Against the current, unfixed
`plugin-history-sync` the cases that exercise a vetoed navigation that touches
history are **red** — that is correct and expected:

- the four-problem cases;
- the coexistence-contract cases that block a pop and the blocker cases that
  block a pop/stepPop (the URL desyncs from the committed stack);
- the concurrency cases whose consistency depends on the fix.

The baseline navigation suite (history-sync behaviors with the blocker present
but disarmed) is **green** — it proves the harness models the system correctly,
so the reds are genuine product desyncs rather than harness faults. The cases
that don't touch a vetoed backward navigation (allowed navigations, blocked
pushes/replaces with no history side effect, the blocker-internal contracts) are
also green. When the product upholds browser == stack across `preventDefault`,
the whole gate turns green.

## What is and isn't asserted

Tests assert only externally observable behavior:

- **SCREEN** — the visible activity/step (DOM markers).
- **URL** — `window.location`.
- **STACK** — the public `getStack()` snapshot (top activity, params, steps).
- **NAVIGABILITY** — where `browserBack`/`browserForward` reach at rest.
- **Harness-owned signals** — the blocker's own `shouldBlock`/`onBlocked`
  notifications and `onError` sink, and the probe co-plugin's own hook calls.

Internal coordinates (history `state` ordinals, suppression tokens, the sync
queue, history-sync's own before/after hooks) are never read. Settle is observed,
never slept for: a step is done only once the public transition state is idle and
a double-stable check (two snapshots separated by ≥1 animation frame + 1
macrotask) agrees.

## Layout

```
src/
  shared/contract.ts   the observation contract: test ids, query knobs, bridge shape
  app/                 the harness app (both plugins, controls, blocker UI, probe, bridge)
  dal/                 Driver Abstraction Layer over a Chromium page + per-file fixture
  t1/                  real-browser specs (problems, compat, concurrency, history-sync, blocker)
  t2i/                 jsdom integration spec (blocker-internal contracts)
```

The app is configured entirely by URL query knobs (`order`, `hash`, `lazyDelay`,
`block`, `blockers`, `blockAsync`, `probe`, …), so each scenario is a pure
function of how the driver opened it. See `src/shared/contract.ts`.

> Note: this package exposes no `typecheck` script. Because it aliases the
> plugins' current **source**, a per-package `tsc` pulls that product source in
> and surfaces strict-mode diagnostics that are not harness-code issues — so it
> is not a meaningful `tsc` target. The harness's guarantees come from the test
> suites (`test:e2e` / `test:t1` / `test:t2i`) and the production build; each
> plugin type-checks itself in its own package.

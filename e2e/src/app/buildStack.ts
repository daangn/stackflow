/**
 * Builds the stackflow instance for one harness configuration. history-sync and
 * blocker are always both applied; their relative registration order and the
 * optional probe co-plugin's placement are driven by the query so the same app
 * exercises order-independence and the replay-interaction contract.
 */

import { defineConfig } from "@stackflow/config";
import { blockerPlugin } from "@stackflow/plugin-blocker";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { type StackflowReactPlugin, stackflow } from "@stackflow/react";
import { Article, Fourth, Home, Lazy, Third } from "./activities/activities";
import { harnessStore } from "./harnessStore";
import { makeProbePlugin } from "./plugins/probePlugin";
import { spyPlugin } from "./plugins/spyPlugin";
import type { HarnessConfig } from "./query";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildStack(hc: HarnessConfig) {
  const config = defineConfig({
    activities: [
      { name: "Home", route: "/" },
      { name: "Article", route: "/articles/:articleId" },
      { name: "Third", route: "/third/:thirdId" },
      { name: "Fourth", route: "/fourth/:fourthId" },
      // The async loader is what makes Lazy hold a "paused" window of width
      // lazyDelay (plugin-loader pauses the stack while a loader is pending).
      { name: "Lazy", route: "/lazy", loader: () => delay(hc.lazyDelayMs) },
    ],
    transitionDuration: hc.transitionDuration,
    initialActivity: () => "Home",
  });

  const history = historySyncPlugin({
    config,
    fallbackActivity: () => {
      harnessStore.incFallbackCount();
      return "Home";
    },
    useHash: hc.useHash,
  });

  const blocker = blockerPlugin({
    onError: (error) => harnessStore.logError(error),
  });

  const orderedNav: StackflowReactPlugin[] =
    hc.order === "blocker-first" ? [blocker, history] : [history, blocker];

  if (hc.probe) {
    const probe = makeProbePlugin(hc.probe.mode);
    const blockerIndex = orderedNav.indexOf(blocker);
    orderedNav.splice(
      hc.probe.placement === "before" ? blockerIndex : blockerIndex + 1,
      0,
      probe,
    );
  }

  const { Stack, actions, stepActions } = stackflow({
    config,
    components: { Home, Article, Third, Fourth, Lazy },
    plugins: [basicRendererPlugin(), spyPlugin, ...orderedNav],
  });

  return { Stack, actions, stepActions, config };
}

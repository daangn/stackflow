/* @jsxImportSource solid-js */

import type { StackflowSolidPlugin } from "@stackflow/solid";
import { For, Show } from "solid-js";

export function basicRendererPlugin(): StackflowSolidPlugin {
  return () => ({
    key: "plugin-renderer-basic",
    render({ stack }) {
      return (
        <For each={stack.render().activities()}>
          {(activity) => (
            <Show when={activity.transitionState !== "exit-done"}>
              {activity.render()}
            </Show>
          )}
        </For>
      );
    },
  });
}

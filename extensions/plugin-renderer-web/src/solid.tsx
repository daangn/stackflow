/* @jsxImportSource solid-js */

import type { StackflowSolidPlugin } from "@stackflow/solid";
import { For, Show } from "solid-js";

export function webRendererPlugin(): StackflowSolidPlugin {
  return () => ({
    key: "plugin-renderer-web-solid",
    render({ stack }) {
      return (
        <For each={stack.render().activities()}>
          {(activity) => (
            <Show when={activity.isActive}>{activity.render()}</Show>
          )}
        </For>
      );
    },
  });
}

import { StackflowPlugin } from "@stackflow/react";

interface HistorySyncPluginOptions {}
export function historySyncPlugin(
  options: HistorySyncPluginOptions,
): StackflowPlugin {
  return {
    id: "historySync",
    onPushed({ dispatchEvent }) {
      console.log("pushed!");
    },
    onPopped({ dispatchEvent }) {
      console.log("popped!");
    },
  };
}

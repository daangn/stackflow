import type { StackflowReactPlugin } from "@stackflow/react";
import { BlockProvider } from "BlockContext";
import type { History, Listener } from "history";
import { createBrowserHistory, createMemoryHistory } from "history";

type HistoryBlockPluginOptions = {
  history: History;
};

export function historySyncPlugin(
  options: HistoryBlockPluginOptions,
): StackflowReactPlugin {
  const { history } = options;

  const context = {
    blocked: false,
  };

  return () => ({
    key: "plugin-history-block",
    wrapStack({ stack }) {
      return <BlockProvider history={history}>{stack.render()}</BlockProvider>;
    },
    onBeforeStepPop({ actions: { preventDefault } }) {
      if (context.blocked) {
        preventDefault();
      }
    },
    onBeforePop({ actions: { preventDefault } }) {
      if (context.blocked) {
        preventDefault();
      }
    },
  });
}

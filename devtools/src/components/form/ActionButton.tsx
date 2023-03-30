import { id, StackflowActions } from "@stackflow/core";

import * as css from "./ActionButton.css";

export type ActionType = keyof Omit<
  StackflowActions,
  "dispatchEvent" | "getStack"
>;

export default function ActionButton({
  type,
  params,
  activityName,
}: {
  type: ActionType;
  params?: any;
  activityName?: string;
}) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <button
      onClick={(e) => {
        console.log("dispatch:", type, params);

        chrome.devtools.inspectedWindow.eval(
          `window.__STACKFLOW_DEVTOOLS__.actions.${type}(${
            params && activityName && type !== "pop" && type !== "stepPop"
              ? JSON.stringify({
                  activityId: id(),
                  activityName,
                  activityParams: params,
                })
              : ""
          })`,
        );
      }}
      className={css.button}
    >
      {label}
    </button>
  );
}

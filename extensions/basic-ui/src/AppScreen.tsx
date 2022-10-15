import { useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useMemo, useRef } from "react";

import AppBar from "./AppBar";
import * as css from "./AppScreen.css";
import type { PropOf } from "./utils";
import { compactMap, useActivitiesFilter, useLazy } from "./utils";

interface AppScreenProps {
  theme?: "android" | "cupertino";
  appBar?: Omit<PropOf<typeof AppBar>, "theme" | "ref">;
  backgroundColor?: string;
  children: React.ReactNode;
}
const AppScreen: React.FC<AppScreenProps> = ({
  theme,
  appBar,
  children,
  backgroundColor,
}) => {
  const stack = useStack();

  const currentActivity = useActivity();

  const visibleActivities = useActivitiesFilter({
    or: ["enter-active", "enter-done", "exit-active"],
  });

  const isRoot = visibleActivities[0]?.id === currentActivity.id;

  const zIndex = useMemo(
    () =>
      visibleActivities.findIndex(
        (activity) => activity.id === currentActivity.id,
      ),
    [visibleActivities, currentActivity],
  );

  const appScreenRef = useRef<any>(null);

  const hasAppBar = !!appBar;

  const zIndexBase = zIndex * 5;
  const zIndexDim = zIndexBase;
  const zIndexPaper = zIndexBase + (theme === "cupertino" && hasAppBar ? 1 : 3);
  const zIndexEdge = zIndexBase + 4;
  const zIndexAppBar = zIndexBase + 7;

  return (
    <div
      ref={appScreenRef}
      className={css.appScreen({
        theme,
        transitionState: useLazy(currentActivity.transitionState) ?? undefined,
      })}
      style={assignInlineVars(
        compactMap({
          [css.vars.backgroundColor]: backgroundColor,
          [css.vars.appBar.height]: appBar?.height,
          [css.localVars.zIndexes.dim]: `${zIndexDim}`,
          [css.localVars.zIndexes.paper]: `${zIndexPaper}`,
          [css.localVars.zIndexes.edge]: `${zIndexEdge}`,
          [css.localVars.zIndexes.appBar]: `${zIndexAppBar}`,
          [css.localVars.transitionDuration]:
            stack.globalTransitionState === "loading"
              ? `${stack.transitionDuration}ms`
              : "0ms",
        }),
      )}
    >
      <div className={css.dim} />
      <div
        key={currentActivity.id}
        className={css.paper({
          hasAppBar,
        })}
      >
        {children}
      </div>
      {!isRoot && theme === "cupertino" && (
        <div className={css.edge({ hasAppBar })} />
      )}
      {appBar && <AppBar {...appBar} theme={theme} />}
    </div>
  );
};

export default AppScreen;

import { useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import AppBar from "./AppBar";
import * as css from "./AppScreen.css";
import type { PropOf } from "./utils";
import { compactMap, useLazy } from "./utils";

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
  const activity = useActivity();

  const appScreenRef = useRef<any>(null);

  const isRoot = activity.zIndex === 0;
  const hasAppBar = !!appBar;

  const zIndexBase = activity.zIndex * 5;
  const zIndexDim = zIndexBase;
  const zIndexPaper = zIndexBase + (theme === "cupertino" && hasAppBar ? 1 : 3);
  const zIndexEdge = zIndexBase + 4;
  const zIndexAppBar = zIndexBase + 7;

  return (
    <div
      ref={appScreenRef}
      className={css.appScreen({
        theme,
        transitionState: useLazy(activity.transitionState) ?? undefined,
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
            activity.transitionState === "enter-done" ||
            activity.transitionState === "enter-active"
              ? `${stack.transitionDuration}ms`
              : "0ms",
        }),
      )}
    >
      <div className={css.dim} />
      <div
        key={activity.id}
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

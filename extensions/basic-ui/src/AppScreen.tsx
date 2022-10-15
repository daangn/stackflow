/* eslint-disable no-param-reassign */

import { useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import AppBar from "./AppBar";
import * as css from "./AppScreen.css";
import { useLazy, useStyleEffectHide, useStyleEffectOffset } from "./hooks";
import type { PropOf } from "./utils";
import { compactMap } from "./utils";

interface AppScreenProps {
  theme?: "android" | "cupertino";
  appBar?: Omit<PropOf<typeof AppBar>, "theme" | "ref">;
  backgroundColor?: string;
  children: React.ReactNode;
}
const AppScreen: React.FC<AppScreenProps> = ({
  theme = "android",
  appBar,
  children,
  backgroundColor,
}) => {
  const activity = useActivity();

  const appScreenRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const appBarRef = useRef<HTMLDivElement>(null);

  useStyleEffectHide({
    refs: [appScreenRef],
  });
  useStyleEffectOffset({
    theme,
    refs: theme === "cupertino" ? [paperRef] : [paperRef, appBarRef],
  });

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
            activity.transitionState === "enter-active" ||
            activity.transitionState === "exit-active"
              ? `var(--stackflow-transition-duration)`
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
        ref={paperRef}
      >
        {children}
      </div>
      {!isRoot && theme === "cupertino" && (
        <div className={css.edge({ hasAppBar })} />
      )}
      {appBar && <AppBar {...appBar} theme={theme} ref={appBarRef} />}
    </div>
  );
};

export default AppScreen;

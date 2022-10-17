/* eslint-disable no-param-reassign */

import { useActions, useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import AppBar from "./AppBar";
import * as css from "./AppScreen.css";
import { globalVars } from "./globalVars.css";
import {
  useLazy,
  useStyleEffectHide,
  useStyleEffectOffset,
  useStyleEffectSwipeBack,
} from "./hooks";
import type { PropOf } from "./utils";
import { compactMap } from "./utils";

interface AppScreenProps {
  theme?: "android" | "cupertino";
  appBar?: Omit<PropOf<typeof AppBar>, "theme" | "ref">;
  children: React.ReactNode;
}
const AppScreen: React.FC<AppScreenProps> = ({
  theme = "android",
  appBar,
  children,
}) => {
  const activity = useActivity();
  const { pop } = useActions();

  const appScreenRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const appBarRef = useRef<HTMLDivElement>(null);

  useStyleEffectHide({
    refs: [appScreenRef],
    hasEffect: true,
  });
  useStyleEffectOffset({
    theme,
    refs: theme === "cupertino" ? [paperRef] : [paperRef, appBarRef],
    hasEffect: true,
  });
  useStyleEffectSwipeBack({
    theme,
    dimRef,
    edgeRef,
    paperRef,
    hasEffect: true,
    onSwiped() {
      pop();
    },
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
        transitionState: useLazy(activity.transitionState),
      })}
      style={assignInlineVars(
        compactMap({
          [globalVars.appBar.height]: appBar?.height,
          [css.vars.zIndexes.dim]: `${zIndexDim}`,
          [css.vars.zIndexes.paper]: `${zIndexPaper}`,
          [css.vars.zIndexes.edge]: `${zIndexEdge}`,
          [css.vars.zIndexes.appBar]: `${zIndexAppBar}`,
          [css.vars.transitionDuration]:
            activity.transitionState === "enter-active" ||
            activity.transitionState === "exit-active"
              ? `var(--stackflow-transition-duration)`
              : "0ms",
        }),
      )}
    >
      <div className={css.dim} ref={dimRef} />
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
        <div className={css.edge({ hasAppBar })} ref={edgeRef} />
      )}
      {appBar && <AppBar {...appBar} theme={theme} ref={appBarRef} />}
    </div>
  );
};

export default AppScreen;

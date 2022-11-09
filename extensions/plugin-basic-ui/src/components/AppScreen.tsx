/* eslint-disable no-param-reassign */

import { useActions, useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import { useGlobalOptions } from "../basicUIPlugin";
import {
  useLazy,
  useStyleEffectHide,
  useStyleEffectOffset,
  useStyleEffectSwipeBack,
} from "../hooks";
import type { GlobalVars } from "../theme.css";
import { globalVars } from "../theme.css";
import type { PropOf } from "../utils";
import { compactMap } from "../utils";
import AppBar from "./AppBar";
import * as css from "./AppScreen.css";

type AppScreenProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "dimBackgroundColor">
> & {
  appBar?: Omit<PropOf<typeof AppBar>, "theme" | "ref" | "key">;
  children: React.ReactNode;
};
const AppScreen: React.FC<AppScreenProps> = ({
  backgroundColor,
  dimBackgroundColor,
  appBar,
  children,
}) => {
  const globalOptions = useGlobalOptions();
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
    theme: globalOptions.theme,
    refs:
      globalOptions.theme === "cupertino" ? [paperRef] : [paperRef, appBarRef],
    hasEffect: true,
  });
  useStyleEffectSwipeBack({
    theme: globalOptions.theme,
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
  const zIndexPaper =
    zIndexBase + (globalOptions.theme === "cupertino" && hasAppBar ? 1 : 3);
  const zIndexEdge = zIndexBase + 4;
  const zIndexAppBar = zIndexBase + 7;

  const { transitionState } = activity;
  const lazyTransitionState = useLazy(transitionState);

  return (
    <div
      ref={appScreenRef}
      className={css.appScreen({
        transitionState:
          transitionState === "enter-done" || transitionState === "exit-done"
            ? transitionState
            : lazyTransitionState,
      })}
      style={assignInlineVars(
        compactMap({
          [globalVars.backgroundColor]: backgroundColor,
          [globalVars.dimBackgroundColor]: dimBackgroundColor,
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
      {!isRoot && globalOptions.theme === "cupertino" && (
        <div className={css.edge({ hasAppBar })} ref={edgeRef} />
      )}
      {appBar && <AppBar {...appBar} ref={appBarRef} />}
    </div>
  );
};

export default AppScreen;

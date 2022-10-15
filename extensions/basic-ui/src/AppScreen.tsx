/* eslint-disable no-param-reassign */

import { useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import AppBar from "./AppBar";
import * as css from "./AppScreen.css";
import { useStyleEffect } from "./useStyleEffect";
import type { PropOf } from "./utils";
import { compactMap, listenOnce, requestNextFrame, useLazy } from "./utils";

const OFFSET_TRANSFORM_ANDROID = "translateY(-2rem)";
const OFFSET_TRANSFORM_CUPERTINO = "translateX(-5rem)";

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

  useStyleEffect({
    styleName: "offset",
    refs: theme === "cupertino" ? [paperRef] : [paperRef, appBarRef],
    effect({ activityTransitionState, refs }) {
      const transform =
        theme === "cupertino"
          ? OFFSET_TRANSFORM_CUPERTINO
          : OFFSET_TRANSFORM_ANDROID;

      switch (activityTransitionState) {
        case "enter-active":
        case "enter-done": {
          refs.forEach((ref) => {
            ref.current.style.transition = `transform var(--stackflow-transition-duration)`;
            ref.current.style.transform = transform;
          });
          break;
        }
        case "exit-active":
        case "exit-done": {
          requestNextFrame(() => {
            refs.forEach((ref) => {
              ref.current.style.transform = "";

              listenOnce(ref.current, "transitionend", () => {
                ref.current.style.transition = "";
              });
            });
          });
          break;
        }
        default: {
          break;
        }
      }
    },
  });

  useStyleEffect({
    styleName: "display-none",
    refs: [appScreenRef],
    effect({ activityTransitionState, refs }) {
      switch (activityTransitionState) {
        case "enter-done": {
          refs.forEach((ref) => {
            ref.current.style.display = "none";
          });
          break;
        }
        default: {
          refs.forEach((ref) => {
            ref.current.style.display = "";
          });
          break;
        }
      }
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

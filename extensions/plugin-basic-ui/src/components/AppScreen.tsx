/* eslint-disable no-param-reassign */

import { useActions } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import { createContext, useContext, useMemo, useRef } from "react";

import { useGlobalOptions } from "../basicUIPlugin";
import {
  useLazy,
  useNullableActivity,
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

export type AppScreenContext = {
  scroll: (args: { top: number }) => void;
};
const Context = createContext<AppScreenContext>(null as any);

export function useAppScreen() {
  return useContext(Context);
}

export type AppScreenProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "dimBackgroundColor">
> & {
  appBar?: Omit<PropOf<typeof AppBar>, "theme" | "ref" | "key">;
  preventSwipeBack?: boolean;
  modalPresentationStyle?: "fullScreen";
  children: React.ReactNode;
};
const AppScreen: React.FC<AppScreenProps> = ({
  backgroundColor,
  dimBackgroundColor,
  appBar,
  preventSwipeBack,
  modalPresentationStyle,
  children,
}) => {
  const globalOptions = useGlobalOptions();
  const activity = useNullableActivity();

  const { pop } = useActions();

  const appScreenRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const appBarRef = useRef<HTMLDivElement>(null);

  const presentModalFullScreen = modalPresentationStyle === "fullScreen";
  const swipeBackPrevented = preventSwipeBack || presentModalFullScreen;

  useStyleEffectHide({
    refs: [appScreenRef],
    hasEffect: true,
  });
  useStyleEffectOffset({
    theme: globalOptions.theme,
    refs:
      globalOptions.theme === "cupertino" ? [paperRef] : [paperRef, appBarRef],
    hasEffect: !presentModalFullScreen,
  });
  useStyleEffectSwipeBack({
    theme: globalOptions.theme,
    dimRef,
    edgeRef,
    paperRef,
    hasEffect: true,
    prevented: swipeBackPrevented,
    onSwiped() {
      pop();
    },
  });

  const hasAppBar = !!appBar;

  const zIndexBase = (activity?.zIndex ?? 0) * 5;
  const zIndexDim = zIndexBase;
  const zIndexPaper =
    zIndexBase + (globalOptions.theme === "cupertino" && hasAppBar ? 1 : 3);
  const zIndexEdge = zIndexBase + 4;
  const zIndexAppBar =
    globalOptions.theme === "cupertino" ? zIndexBase + 7 : zIndexBase + 4;

  const transitionState = activity?.transitionState ?? "enter-done";
  const lazyTransitionState = useLazy(transitionState);

  const onAppBarTopClick: React.MouseEventHandler = (e) => {
    appBar?.onTopClick?.(e);

    if (!e.defaultPrevented) {
      paperRef.current?.scroll({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          scroll({ top }) {
            paperRef?.current?.scroll({
              top,
              behavior: "smooth",
            });
          },
        }),
        [paperRef],
      )}
    >
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
            [globalVars.appBar.heightTransitionDuration]:
              appBar?.heightTransitionDuration,
            [css.vars.zIndexes.dim]: `${zIndexDim}`,
            [css.vars.zIndexes.paper]: `${zIndexPaper}`,
            [css.vars.zIndexes.edge]: `${zIndexEdge}`,
            [css.vars.zIndexes.appBar]: `${zIndexAppBar}`,
            [css.vars.transitionDuration]:
              transitionState === "enter-active" ||
              transitionState === "exit-active"
                ? globalVars.transitionDuration
                : "0ms",
          }),
        )}
      >
        <div className={css.dim} ref={dimRef} />
        {appBar && (
          <AppBar
            {...appBar}
            ref={appBarRef}
            modalPresentationStyle={modalPresentationStyle}
            onTopClick={onAppBarTopClick}
          />
        )}
        <div
          key={activity?.id}
          className={css.paper({
            hasAppBar,
            presentModalFullScreen,
          })}
          ref={paperRef}
        >
          {children}
        </div>
        {!activity?.isRoot &&
          globalOptions.theme === "cupertino" &&
          !swipeBackPrevented && (
            <div className={css.edge({ hasAppBar })} ref={edgeRef} />
          )}
      </div>
    </Context.Provider>
  );
};

AppScreen.displayName = "AppScreen";

export default AppScreen;

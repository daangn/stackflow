import { useActions, useStack } from "@stackflow/react";
import {
  useActivityDataAttributes,
  useLazy,
  useMounted,
  useNullableActivity,
  usePreventTouchDuringTransition,
  useStyleEffectHide,
  useStyleEffectOffset,
  useStyleEffectSwipeBack,
  useZIndexBase,
} from "@stackflow/react-ui-core";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import clsx from "clsx";
import { createContext, useContext, useMemo, useRef } from "react";
import { useGlobalOptions } from "../basicUIPlugin";
import type { GlobalVars } from "../basicUIPlugin.css";
import { globalVars } from "../basicUIPlugin.css";
import type { PropOf } from "../utils";
import { compactMap } from "../utils";
import AppBar from "./AppBar";
import * as css from "./AppScreen.css";

export const OFFSET_PX_ANDROID = 32;
export const OFFSET_PX_CUPERTINO = 80;

export type AppScreenContext = {
  scroll: (args: { top: number }) => void;
  zIndices: {
    dim: number;
    paper: number;
    edge: number;
    appBar: number;
  };
};
const Context = createContext<AppScreenContext>(null as any);

export function useAppScreen() {
  return useContext(Context);
}

export type AppScreenProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "backgroundImage" | "dimBackgroundColor">
> & {
  appBar?: Omit<
    PropOf<typeof AppBar>,
    "theme" | "modalPresentationStyle" | "ref" | "key"
  >;
  preventSwipeBack?: boolean;
  CUPERTINO_ONLY_modalPresentationStyle?: "fullScreen";
  ANDROID_ONLY_activityEnterStyle?: "slideInLeft";
  className?: string;
  children: React.ReactNode;
};
const AppScreen: React.FC<AppScreenProps> = ({
  backgroundColor,
  backgroundImage,
  dimBackgroundColor,
  appBar,
  preventSwipeBack,
  CUPERTINO_ONLY_modalPresentationStyle,
  ANDROID_ONLY_activityEnterStyle,
  className,
  children,
}) => {
  const globalOptions = useGlobalOptions();
  const activity = useNullableActivity();
  const activityDataAttributes = useActivityDataAttributes();
  const mounted = useMounted();

  const { pop } = useActions();

  const appScreenRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const appBarRef = useRef<HTMLDivElement>(null);
  const paperContentRef = useRef<HTMLDivElement>(null);

  const modalPresentationStyle =
    globalOptions.theme === "cupertino"
      ? CUPERTINO_ONLY_modalPresentationStyle
      : undefined;
  const activityEnterStyle =
    globalOptions.theme === "android"
      ? ANDROID_ONLY_activityEnterStyle
      : undefined;

  const isSwipeBackPrevented =
    preventSwipeBack || modalPresentationStyle === "fullScreen";

  const hasAppBar = !!appBar;

  const zIndexBase = useZIndexBase();

  let zIndexDim: number;
  let zIndexPaper: number;
  let zIndexEdge: number;
  let zIndexAppBar: number;

  switch (globalOptions.theme) {
    case "cupertino": {
      zIndexDim =
        zIndexBase + (modalPresentationStyle === "fullScreen" ? 2 : 0);
      zIndexPaper =
        zIndexBase +
        (hasAppBar && modalPresentationStyle !== "fullScreen"
          ? appBar.enterStyle === "cover"
            ? 2
            : 1
          : 3);
      zIndexEdge = zIndexBase + 4;
      zIndexAppBar = zIndexBase + 7;
      break;
    }
    default: {
      zIndexDim = zIndexBase;
      zIndexPaper =
        zIndexBase +
        (activityEnterStyle === "slideInLeft" && appBar?.enterStyle !== "cover"
          ? 0
          : 2);
      zIndexEdge = zIndexBase + 4;
      zIndexAppBar =
        zIndexBase + (activityEnterStyle === "slideInLeft" ? 6 : 4);
      break;
    }
  }

  const transitionState = activity?.transitionState ?? "enter-done";
  const lazyTransitionState = useLazy(transitionState);

  useStyleEffectHide({
    refs: [appScreenRef],
  });
  useStyleEffectOffset({
    refs:
      (globalOptions.theme === "cupertino" ||
        activityEnterStyle === "slideInLeft") &&
      appBar?.enterStyle !== "cover"
        ? [paperRef]
        : [paperRef, appBarRef],
    offsetStyles:
      globalOptions.theme === "cupertino"
        ? {
            transform: `translate3d(-${OFFSET_PX_CUPERTINO / 16}rem, 0, 0)`,
            opacity: "1",
          }
        : activityEnterStyle === "slideInLeft"
          ? {
              transform: "translate3d(-50%, 0, 0)",
              opacity: "0",
            }
          : {
              transform: `translate3d(0, -${OFFSET_PX_ANDROID / 16}rem, 0)`,
              opacity: "1",
            },
    transitionDuration: globalVars.computedTransitionDuration,
    hasEffect: modalPresentationStyle !== "fullScreen",
  });
  useStyleEffectSwipeBack({
    dimRef,
    edgeRef,
    paperRef,
    appBarRef,
    offset: OFFSET_PX_CUPERTINO,
    transitionDuration: globalVars.transitionDuration,
    moveAppBarTogether: appBar?.enterStyle === "cover",
    preventSwipeBack:
      isSwipeBackPrevented || globalOptions.theme !== "cupertino",
    getActivityTransitionState() {
      const $paper = paperRef.current;
      const $appScreen = $paper?.parentElement;

      if (!$appScreen) {
        return null;
      }

      if ($appScreen.classList.contains(css.enterActive)) {
        return "enter-active";
      }
      if ($appScreen.classList.contains(css.enterDone)) {
        return "enter-done";
      }
      if ($appScreen.classList.contains(css.exitActive)) {
        return "exit-active";
      }
      if ($appScreen.classList.contains(css.exitDone)) {
        return "exit-done";
      }

      return null;
    },
    onTransitionEnd({ swiped }) {
      if (swiped) {
        pop({
          skipActiveState: true
        });
      }
    },
  });

  const onAppBarTopClick: React.MouseEventHandler = (e) => {
    appBar?.onTopClick?.(e);

    if (!e.defaultPrevented) {
      paperContentRef.current?.scroll({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  usePreventTouchDuringTransition({
    ref: appScreenRef,
  });

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          scroll({ top }) {
            paperContentRef?.current?.scroll({
              top,
              behavior: "smooth",
            });
          },
          zIndices: {
            dim: zIndexDim,
            paper: zIndexPaper,
            edge: zIndexEdge,
            appBar: zIndexAppBar,
          },
        }),
        [paperContentRef, zIndexDim, zIndexPaper, zIndexEdge, zIndexAppBar],
      )}
    >
      <div
        ref={appScreenRef}
        className={clsx(
          css.appScreen({
            hasAppBar,
            transitionState:
              transitionState === "enter-done" ||
              transitionState === "exit-done"
                ? transitionState
                : lazyTransitionState,
          }),
          className,
        )}
        style={assignInlineVars(
          compactMap({
            [globalVars.backgroundColor]: backgroundColor,
            [globalVars.backgroundImage]: backgroundImage,
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
                ? globalVars.computedTransitionDuration
                : "0ms",
          }),
        )}
        data-stackflow-component-name="AppScreen"
        {...activityDataAttributes}
      >
        {activityEnterStyle !== "slideInLeft" && (
          <div
            ref={dimRef}
            className={css.dim}
            data-part="dim"
            {...activityDataAttributes}
          />
        )}
        {appBar && (
          <AppBar
            {...appBar}
            ref={appBarRef}
            modalPresentationStyle={modalPresentationStyle}
            activityEnterStyle={activityEnterStyle}
            onTopClick={onAppBarTopClick}
          />
        )}
        <div
          key={activity?.id}
          ref={paperRef}
          className={css.paper({
            hasAppBar,
            modalPresentationStyle,
            activityEnterStyle,
          })}
          data-part="paper"
          {...activityDataAttributes}
        >
          <div
            ref={paperContentRef}
            className={css.paperContent({ hasAppBar })}
          >
            {children}
          </div>
        </div>
        {!activity?.isRoot &&
          globalOptions.theme === "cupertino" &&
          !isSwipeBackPrevented && (
            <div
              ref={edgeRef}
              className={css.edge({ hasAppBar })}
              data-part="edge"
              {...activityDataAttributes}
            />
          )}
      </div>
    </Context.Provider>
  );
};

export default AppScreen;

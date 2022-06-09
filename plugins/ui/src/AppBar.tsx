import { useActivity, useStack, useStackActions } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useEffect, useMemo, useRef, useState } from "react";

import * as css from "./AppBar.css";
import * as appScreenCss from "./AppScreen.css";
import { IconBack, IconClose } from "./assets";

const noop = () => {};

const onResize = (cb: () => void) => {
  cb();
  window.addEventListener("resize", cb);

  return () => {
    window.removeEventListener("resize", cb);
  };
};

interface AppBarProps {
  theme: "android" | "cupertino";
  title?: string;
  appendLeft?: () => React.ReactNode;
  appendRight?: () => React.ReactNode;
  closeButtonLocation?: "left" | "right";
  customBackButton?: () => React.ReactNode;
  customCloseButton?: () => React.ReactNode;
  onClose?: () => void;
  border?: boolean;
}
const AppBar: React.FC<AppBarProps> = ({
  theme,
  title,
  appendLeft,
  appendRight,
  closeButtonLocation = "left",
  customBackButton,
  customCloseButton,
  onClose,
  border = true,
}) => {
  const stack = useStack();
  const currentActivity = useActivity();
  const stackActions = useStackActions();

  const activeActivities = useMemo(
    () =>
      stack.activities.filter(
        (activity) =>
          activity.transitionState === "enter-active" ||
          activity.transitionState === "enter-done",
      ),
    [stack.activities],
  );

  const isRoot = activeActivities[0]?.id === currentActivity.id;

  const appBarRef = useRef<HTMLDivElement>(null);
  const appBarCenterRef = useRef<HTMLDivElement>(null);

  const [centerMainWidth, setCenterMainWidth] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    const $appBar = appBarRef.current;
    const $appBarCenter = appBarCenterRef.current;

    if (theme !== "cupertino" || !$appBar || !$appBarCenter) {
      return noop;
    }

    const dispose = onResize(() => {
      const screenWidth = $appBar.clientWidth;

      const leftWidth = $appBarCenter.offsetLeft;
      const centerWidth = $appBarCenter.clientWidth;
      const rightWidth = screenWidth - leftWidth - centerWidth;

      const sideMargin = Math.max(leftWidth, rightWidth);

      setCenterMainWidth(screenWidth - 2 * sideMargin);
    });

    return dispose;
  }, []);

  const onBack = () => {
    stackActions.pop();
  };

  const backButton = !isRoot && (
    <button type="button" className={css.backButton} onClick={onBack}>
      {customBackButton ? customBackButton() : <IconBack />}
    </button>
  );

  const closeButton = onClose && isRoot && (
    <button type="button" className={css.closeButton} onClick={onClose}>
      {customCloseButton ? customCloseButton() : <IconClose />}
    </button>
  );

  const hasLeft = !!(
    (closeButtonLocation === "left" && closeButton) ||
    backButton ||
    appendLeft
  );

  return (
    <div
      ref={appBarRef}
      className={css.appBar({
        border,
      })}
      style={assignInlineVars({
        [appScreenCss.vars.appBar.center.mainWidth]: `${centerMainWidth}px`,
      })}
    >
      <div className={css.left}>
        {closeButtonLocation === "left" && closeButton}
        {backButton}
        {appendLeft?.()}
      </div>
      <div ref={appBarCenterRef} className={css.appBarCenter}>
        <div
          className={css.appBarCenterMain({
            theme,
            hasLeft,
          })}
        >
          <div className={css.appBarCenterMainText}>{title}</div>
        </div>
      </div>
      <div className={css.appBarRight}>
        {appendRight?.()}
        {closeButtonLocation === "right" && closeButton}
      </div>
    </div>
  );
};

export default AppBar;

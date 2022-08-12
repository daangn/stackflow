import { useActions, useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useMemo } from "react";

import * as css from "./AppBar.css";
import * as appScreenCss from "./AppScreen.css";
import { IconBack, IconClose } from "./assets";
import {
  compactMap,
  noop,
  useActiveActivities,
  useMaxWidth,
  useTopActiveActivity,
} from "./utils";

interface AppBarProps {
  theme?: "android" | "cupertino";
  title?: React.ReactNode;
  appendLeft?: () => React.ReactNode;
  appendRight?: () => React.ReactNode;
  backButton?:
    | {
        renderIcon?: () => React.ReactNode;
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
      }
    | {
        render?: () => React.ReactNode;
      };
  closeButton?:
    | {
        renderIcon?: () => React.ReactNode;
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
      }
    | {
        render?: () => React.ReactNode;
      };
  closeButtonLocation?: "left" | "right";
  border?: boolean;
  iconColor?: string;
  textColor?: string;
  borderColor?: string;
  height?: string;
}
const AppBar: React.FC<AppBarProps> = ({
  theme,
  title,
  appendLeft,
  appendRight,
  backButton,
  closeButton,
  closeButtonLocation = "left",
  border = true,
  iconColor,
  textColor,
  borderColor,
  height,
}) => {
  const actions = useActions();

  const currentActivity = useActivity();
  const activeActivities = useActiveActivities();
  const topActiveActivity = useTopActiveActivity();

  const isTopActive = useMemo(
    () => topActiveActivity?.id === currentActivity.id,
    [topActiveActivity, currentActivity],
  );

  const isRoot = activeActivities[0]?.id === currentActivity.id;
  const isAfterRoot = activeActivities[1]?.id === currentActivity.id;
  const isPushedByReplace = currentActivity.pushedBy.name === "Replaced";

  const isCloseButtonVisible = isRoot || (isAfterRoot && isPushedByReplace);

  const {
    outerRef: appBarRef,
    innerRef: centerRef,
    maxWidth,
  } = useMaxWidth({
    enable: theme === "cupertino",
  });

  const onBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (backButton && "onClick" in backButton && backButton.onClick) {
      backButton.onClick(e);
    }

    if (!e.defaultPrevented) {
      actions.pop();
    }
  };

  const renderBackButton = () => {
    if (isCloseButtonVisible) {
      return null;
    }

    if (!backButton) {
      return (
        <button type="button" className={css.backButton} onClick={onBack}>
          <IconBack />
        </button>
      );
    }

    if ("render" in backButton && backButton.render) {
      return backButton.render?.();
    }

    return (
      <button type="button" className={css.backButton} onClick={onBack}>
        {"renderIcon" in backButton && backButton.renderIcon ? (
          backButton.renderIcon()
        ) : (
          <IconBack />
        )}
      </button>
    );
  };

  const renderCloseButton = () => {
    if (!closeButton || !isCloseButtonVisible) {
      return null;
    }
    if ("render" in closeButton && closeButton.render) {
      return closeButton.render();
    }

    return (
      <button
        type="button"
        className={css.closeButton}
        onClick={"onClick" in closeButton ? closeButton.onClick : noop}
      >
        {"renderIcon" in closeButton && closeButton.renderIcon ? (
          closeButton.renderIcon()
        ) : (
          <IconClose />
        )}
      </button>
    );
  };

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
        isTopActive,
      })}
      style={assignInlineVars(
        compactMap({
          [appScreenCss.vars.appBar.iconColor]: iconColor,
          [appScreenCss.vars.appBar.textColor]: textColor,
          [appScreenCss.vars.appBar.borderColor]: borderColor,
          [appScreenCss.vars.appBar.height]: height,
          [appScreenCss.localVars.appBar.center.mainWidth]: `${maxWidth}px`,
        }),
      )}
    >
      <div className={css.left}>
        {closeButtonLocation === "left" && renderCloseButton()}
        {renderBackButton()}
        {appendLeft?.()}
      </div>
      <div ref={centerRef} className={css.center}>
        <div
          className={css.centerMain({
            hasLeft,
          })}
        >
          {typeof title === "string" ? (
            <div className={css.centerText}>{title}</div>
          ) : (
            title
          )}
        </div>
      </div>
      <div className={css.right}>
        {appendRight?.()}
        {closeButtonLocation === "right" && renderCloseButton()}
      </div>
    </div>
  );
};

export default AppBar;

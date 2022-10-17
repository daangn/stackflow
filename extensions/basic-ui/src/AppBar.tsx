import { useActions, useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import * as css from "./AppBar.css";
import * as appScreenCss from "./AppScreen.css";
import { IconBack, IconClose } from "./assets";
import { globalVars } from "./globalVars.css";
import { useMaxWidth } from "./hooks";
import { compactMap, noop } from "./utils";

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
const AppBar = React.forwardRef<HTMLDivElement, AppBarProps>(
  (
    {
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
    },
    ref,
  ) => {
    const actions = useActions();
    const activity = useActivity();

    const centerRef = useRef<any>(null);

    const { maxWidth } = useMaxWidth({
      outerRef: ref,
      innerRef: centerRef,
      enable: theme === "cupertino",
    });

    const onBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (backButton && "onClick" in backButton && backButton.onClick) {
        backButton.onClick(e);
      }

      if (!e.defaultPrevented) {
        actions.pop();
      }
    };

    const isCloseButtonVisible =
      activity.zIndex === 0 ||
      (activity.zIndex === 1 &&
        activity.transitionState === "enter-active" &&
        activity.pushedBy.name === "Replaced");

    const renderBackButton = () => {
      if (isCloseButtonVisible) {
        return null;
      }

      if (!backButton) {
        return (
          <button
            type="button"
            className={css.backButton}
            onClick={onBackClick}
          >
            <IconBack />
          </button>
        );
      }

      if ("render" in backButton && backButton.render) {
        return backButton.render?.();
      }

      return (
        <button type="button" className={css.backButton} onClick={onBackClick}>
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
        ref={ref}
        className={css.appBar({
          border,
          isActive: activity.isActive,
        })}
        style={assignInlineVars(
          compactMap({
            [globalVars.appBar.iconColor]: iconColor,
            [globalVars.appBar.textColor]: textColor,
            [globalVars.appBar.borderColor]: borderColor,
            [globalVars.appBar.height]: height,
            [appScreenCss.vars.appBar.center.mainWidth]: `${maxWidth}px`,
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
  },
);

export default AppBar;

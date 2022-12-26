/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */

import { useActions } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import { useLazy, useNullableActivity, useStyleEffect } from "../hooks";
import type { GlobalVars } from "../theme.css";
import { globalVars } from "../theme.css";
import { compactMap } from "../utils";
import * as css from "./Modal.css";

type ModalProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "dimBackgroundColor">
> &
  Partial<GlobalVars["modal"]> & {
    onOutsideClick?: React.MouseEventHandler;
    children: React.ReactNode;
  };
const Modal: React.FC<ModalProps> = ({
  backgroundColor,
  dimBackgroundColor,
  borderRadius = "1rem",
  onOutsideClick,
  children,
}) => {
  const activity = useNullableActivity();
  const { pop } = useActions();

  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useStyleEffect({
    styleName: "hide",
    refs: [containerRef],
  });
  useStyleEffect({
    styleName: "offset",
    refs: [mainRef],
  });
  useStyleEffect({
    styleName: "swipe-back",
    refs: [mainRef],
  });

  const popLock = useRef(false);

  const onDimClick: React.MouseEventHandler = (e) => {
    onOutsideClick?.(e);

    if (e.defaultPrevented) {
      return;
    }

    if (popLock.current) {
      return;
    }
    popLock.current = true;

    pop();
  };
  const onMainClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
  };

  const zIndexBase = (activity?.zIndex ?? 0) * 5 + 3;
  const zIndexMain = (activity?.zIndex ?? 0) * 5 + 4;
  const transitionState = activity?.transitionState ?? "enter-done";

  return (
    <div
      className={css.container({
        transitionState: useLazy(transitionState),
      })}
      ref={containerRef}
      style={assignInlineVars(
        compactMap({
          [globalVars.bottomSheet.borderRadius]: borderRadius,
          [globalVars.backgroundColor]: backgroundColor,
          [globalVars.dimBackgroundColor]: dimBackgroundColor,
          [css.vars.zIndexes.dim]: `${zIndexBase}`,
          [css.vars.zIndexes.main]: `${zIndexMain}`,
          [css.vars.transitionDuration]:
            transitionState === "enter-active" ||
            transitionState === "exit-active"
              ? `var(--stackflow-transition-duration)`
              : "0ms",
        }),
      )}
    >
      <div className={css.dim} onClick={onDimClick}>
        <div className={css.main} ref={mainRef} onClick={onMainClick}>
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.displayName = "Modal";

export default Modal;

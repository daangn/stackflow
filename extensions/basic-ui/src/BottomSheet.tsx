/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */

import { useActions, useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import * as css from "./BottomSheet.css";
import { useLazy, useStyleEffect } from "./hooks";
import { compactMap } from "./utils";

interface BottomSheetProps {
  borderRadius?: string;
  children: React.ReactNode;
}
const BottomSheet: React.FC<BottomSheetProps> = ({
  borderRadius = "1rem",
  children,
}) => {
  const activity = useActivity();
  const { pop } = useActions();

  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useStyleEffect({
    styleName: "hide",
    refs: [containerRef],
  });
  useStyleEffect({
    styleName: "offset",
    refs: [paperRef],
  });
  useStyleEffect({
    styleName: "swipe-back",
    refs: [paperRef],
  });

  const popLock = useRef(false);

  const onDimClick = () => {
    if (popLock.current) {
      return;
    }

    pop();
    popLock.current = true;
  };
  const onPaperClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
  };

  const zIndexBase = activity.zIndex * 5 + 3;
  const zIndexPaper = activity.zIndex * 5 + 4;

  return (
    <div
      className={css.container({
        transitionState: useLazy(activity.transitionState),
      })}
      ref={containerRef}
      style={assignInlineVars(
        compactMap({
          [css.vars.zIndexes.dim]: `${zIndexBase}`,
          [css.vars.zIndexes.paper]: `${zIndexPaper}`,
          [css.vars.transitionDuration]:
            activity.transitionState === "enter-active" ||
            activity.transitionState === "exit-active"
              ? `var(--stackflow-transition-duration)`
              : "0ms",
          [css.vars.paperBorderRadius]: borderRadius,
        }),
      )}
    >
      <div className={css.dim} ref={paperRef} onClick={onDimClick}>
        <div className={css.paper} onClick={onPaperClick}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;

/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */

import { useActions, useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React from "react";

import { useLazy } from "./hooks";
import * as css from "./Modal.css";
import { compactMap } from "./utils";

interface ModalProps {
  borderRadius?: string;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ borderRadius = "1rem", children }) => {
  const activity = useActivity();
  const { pop } = useActions();

  const onDimClick = () => {
    pop();
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
      style={assignInlineVars(
        compactMap({
          [css.localVars.zIndexes.dim]: `${zIndexBase}`,
          [css.localVars.zIndexes.paper]: `${zIndexPaper}`,
          [css.localVars.transitionDuration]:
            activity.transitionState === "enter-active" ||
            activity.transitionState === "exit-active"
              ? `var(--stackflow-transition-duration)`
              : "0ms",
          [css.localVars.paperBorderRadius]: borderRadius,
        }),
      )}
    >
      <div className={css.dim} onClick={onDimClick}>
        <div className={css.paper} onClick={onPaperClick}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

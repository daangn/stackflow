import { useState } from "react";
import * as css from "./Splitter.css";

export default function Splitter({
  mode,
  paneRef,
}: {
  mode: "horizontal" | "vertical";
  paneRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      onMouseDown={(downEvent) => {
        const rect = paneRef.current!.getBoundingClientRect();

        const resizer = (moveEvent: MouseEvent) => {
          // resize flexBasis of paneRef
          paneRef.current!.style.flexBasis = `${
            mode === "horizontal"
              ? rect.height + downEvent.clientY - moveEvent.clientY
              : rect.width + downEvent.clientX - moveEvent.clientX
          }px`;
        };

        window.addEventListener("mousemove", resizer);

        window.addEventListener("mouseup", (e) => {
          window.removeEventListener("mousemove", resizer);
        });
      }}
      className={`${css.divider} ${css[mode]}`}
    ></div>
  );
}

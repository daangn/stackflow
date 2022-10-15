/* eslint-disable no-param-reassign */

import { listenOnce, requestNextFrame } from "../utils";
import { useStyleEffect } from "./useStyleEffect";

const OFFSET_TRANSFORM_ANDROID = "translateY(-2rem)";
const OFFSET_TRANSFORM_CUPERTINO = "translateX(-5rem)";

export function useStyleEffectOffset({
  refs,
  theme,
}: {
  refs: Array<React.RefObject<any>>;
  theme: "android" | "cupertino";
}) {
  useStyleEffect({
    styleName: "offset",
    refs,
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
}

/* eslint-disable no-param-reassign */

import { listenOnce } from "../utils";
import { useStyleEffect } from "./useStyleEffect";
import { OFFSET_PX_CUPERTINO } from "./useStyleEffectOffset";

export function useStyleEffectSwipeBack({
  theme,
  dimRef,
  edgeRef,
  paperRef,
  hasEffect,
  onSwiped,
}: {
  theme: "android" | "cupertino";
  dimRef: React.RefObject<HTMLDivElement>;
  edgeRef: React.RefObject<HTMLDivElement>;
  paperRef: React.RefObject<HTMLDivElement>;
  hasEffect?: boolean;
  onSwiped?: () => void;
}) {
  useStyleEffect({
    styleName: "swipe-back",
    refs: [paperRef],
    effect: hasEffect
      ? ({ refs }) => {
          if (theme !== "cupertino") {
            return () => {};
          }

          if (!dimRef.current || !edgeRef.current || !paperRef.current) {
            return () => {};
          }

          const $dim = dimRef.current;
          const $edge = edgeRef.current;
          const $paper = paperRef.current;

          let x0: number | null = null;
          let t0: number | null = null;
          let x: number | null = null;

          let cachedRefs: Array<{
            style: {
              transform: string;
              transition: string;
            };
            parentElement?: {
              style: {
                display: string;
              };
            };
          }> = [];

          const resetState = () => {
            x0 = null;
            t0 = null;
            x = null;
            cachedRefs = [];
          };

          let _rAFLock = false;

          function movePaper(dx: number) {
            if (!_rAFLock) {
              _rAFLock = true;

              requestAnimationFrame(() => {
                const p = dx / $paper.clientWidth;

                $dim.style.opacity = `${1 - p}`;
                $dim.style.transition = "0s";

                $paper.style.overflowY = "hidden";
                $paper.style.transform = `translateX(${dx}px)`;
                $paper.style.transition = "0s";

                refs.forEach((ref) => {
                  if (!ref.current) {
                    return;
                  }

                  ref.current.style.transform = `translateX(${
                    -1 * (1 - p) * OFFSET_PX_CUPERTINO
                  }px)`;
                  ref.current.style.transition = "0s";

                  if (ref.current.parentElement?.style.display === "none") {
                    ref.current.parentElement.style.display = "block";
                  }
                });

                _rAFLock = false;
              });
            }
          }

          function resetPaper({ swiped }: { swiped: boolean }) {
            requestAnimationFrame(() => {
              $dim.style.opacity = `${swiped ? 0 : 1}`;
              $dim.style.transition = "var(--stackflow-transition-duration)";

              $paper.style.overflowY = "hidden";
              $paper.style.transform = `translateX(${swiped ? "100%" : "0"})`;
              $paper.style.transition = "var(--stackflow-transition-duration)";

              refs.forEach((ref) => {
                if (!ref.current) {
                  return;
                }

                ref.current.style.transition = `var(--stackflow-transition-duration)`;
                ref.current.style.transform = `translateX(${
                  swiped ? "0" : `-${OFFSET_PX_CUPERTINO / 16}rem`
                })`;
              });

              listenOnce($paper, "transitionend", () => {
                $dim.style.opacity = "";
                $paper.style.overflowY = "";
                $paper.style.transform = "";

                refs.forEach((ref, i) => {
                  if (!ref.current) {
                    return;
                  }

                  const cachedRef = cachedRefs[i];

                  if (swiped) {
                    ref.current.style.transition = "";
                    ref.current.style.transform = "";

                    if (ref.current.parentElement) {
                      ref.current.parentElement.style.display = "";
                    }
                  } else if (cachedRef) {
                    ref.current.style.transition = cachedRef.style.transition;
                    ref.current.style.transform = cachedRef.style.transform;

                    if (ref.current.parentElement && cachedRef.parentElement) {
                      ref.current.parentElement.style.display =
                        cachedRef.parentElement.style.display;
                    }
                  }
                });
              });
            });
          }

          const onTouchStart = (e: TouchEvent) => {
            const { activeElement } = document as any;

            activeElement?.blur?.();
            // eslint-disable-next-line no-multi-assign
            x0 = x = e.touches[0].clientX;
            t0 = Date.now();

            cachedRefs = refs.map((ref) => {
              if (!ref.current) {
                return {
                  style: {
                    transform: "",
                    transition: "",
                  },
                };
              }

              return {
                style: {
                  transform: ref.current.style.transform,
                  transition: ref.current.style.transition,
                },
                parentElement: ref.current.parentElement
                  ? {
                      style: {
                        display: ref.current.parentElement.style.display,
                      },
                    }
                  : undefined,
              };
            });
          };

          const onTouchMove = (e: TouchEvent) => {
            if (!x0) {
              resetState();
              return;
            }

            x = e.touches[0].clientX;

            movePaper(x - x0);
          };

          const onTouchEnd = () => {
            if (!x0 || !t0 || !x) {
              resetState();
              return;
            }

            const t = Date.now();
            const v = (x - x0) / (t - t0);
            const swiped = v > 1 || x / $paper.clientWidth > 0.4;

            if (swiped) {
              onSwiped?.();
            }

            resetState();
            resetPaper({ swiped });
          };

          $edge.addEventListener("touchstart", onTouchStart, { passive: true });
          $edge.addEventListener("touchmove", onTouchMove, { passive: true });
          $edge.addEventListener("touchend", onTouchEnd, { passive: true });
          $edge.addEventListener("touchcancel", onTouchEnd, { passive: true });

          return () => {
            $edge.removeEventListener("touchstart", onTouchStart);
            $edge.removeEventListener("touchmove", onTouchMove);
            $edge.removeEventListener("touchend", onTouchEnd);
            $edge.removeEventListener("touchcancel", onTouchEnd);
          };
        }
      : undefined,
  });
}

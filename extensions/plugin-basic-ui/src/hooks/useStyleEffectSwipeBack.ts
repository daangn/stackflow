/* eslint-disable no-param-reassign */

import { globalVars } from "../theme.css";
import { listenOnce, noop } from "../utils";
import { useStyleEffect } from "./useStyleEffect";
import { OFFSET_PX_CUPERTINO } from "./useStyleEffectOffset";

export function useStyleEffectSwipeBack({
  theme,
  dimRef,
  edgeRef,
  paperRef,
  hasEffect,
  prevented,
  onSwiped,
}: {
  theme: "android" | "cupertino";
  dimRef: React.RefObject<HTMLDivElement>;
  edgeRef: React.RefObject<HTMLDivElement>;
  paperRef: React.RefObject<HTMLDivElement>;
  hasEffect?: boolean;
  prevented?: boolean;
  onSwiped?: () => void;
}) {
  useStyleEffect({
    styleName: "swipe-back",
    refs: [paperRef],
    effect: hasEffect
      ? ({ refs }) => {
          if (theme !== "cupertino") {
            return noop;
          }

          if (!dimRef.current || !edgeRef.current || !paperRef.current) {
            return noop;
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
                $paper.style.transform = `translate3d(${dx}px, 0, 0)`;
                $paper.style.transition = "0s";

                refs.forEach((ref) => {
                  if (!ref.current) {
                    return;
                  }

                  ref.current.style.transform = `translate3d(${
                    -1 * (1 - p) * OFFSET_PX_CUPERTINO
                  }px, 0, 0)`;
                  ref.current.style.transition = "0s";

                  if (ref.current.parentElement?.style.display === "none") {
                    ref.current.parentElement.style.display = "block";
                  }
                });

                _rAFLock = false;
              });
            }
          }

          function resetPaper({ swiped }: { swiped: boolean }): Promise<void> {
            return new Promise((resolve) => {
              requestAnimationFrame(() => {
                $dim.style.opacity = `${swiped ? 0 : 1}`;
                $dim.style.transition = globalVars.transitionDuration;

                $paper.style.overflowY = "hidden";
                $paper.style.transform = `translateX(${swiped ? "100%" : "0"})`;
                $paper.style.transition = globalVars.transitionDuration;

                refs.forEach((ref) => {
                  if (!ref.current) {
                    return;
                  }

                  ref.current.style.transition = globalVars.transitionDuration;
                  ref.current.style.transform = `translate3d(${
                    swiped ? "0" : `-${OFFSET_PX_CUPERTINO / 16}rem`
                  }, 0, 0)`;
                });

                const _cachedRefs = [...cachedRefs];

                resolve();

                listenOnce($paper, "transitionend", () => {
                  $dim.style.opacity = "";
                  $paper.style.overflowY = "";
                  $paper.style.transform = "";

                  refs.forEach((ref, i) => {
                    if (!ref.current) {
                      return;
                    }

                    const _cachedRef = _cachedRefs[i];

                    if (swiped) {
                      ref.current.style.transition = "";
                      ref.current.style.transform = "";

                      if (ref.current.parentElement) {
                        ref.current.parentElement.style.display = "";
                      }
                    } else if (_cachedRef) {
                      ref.current.style.transition =
                        _cachedRef.style.transition;
                      ref.current.style.transform = _cachedRef.style.transform;

                      if (
                        ref.current.parentElement &&
                        _cachedRef.parentElement
                      ) {
                        ref.current.parentElement.style.display =
                          _cachedRef.parentElement.style.display;
                      }
                    }
                  });
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

            Promise.resolve()
              .then(() => resetPaper({ swiped }))
              .then(() => resetState());
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
    effectDeps: [prevented],
  });
}

import type { ActivityTransitionState } from "@stackflow/core";
import { useStyleEffect } from "./useStyleEffect";
import { listenOnce, noop } from "./utils";

export const SWIPE_BACK_RATIO_CSS_VAR_NAME = "--stackflow-swipe-back-ratio";

export function useStyleEffectSwipeBack({
  dimRef,
  edgeRef,
  paperRef,
  appBarRef,
  offset,
  transitionDuration,
  preventSwipeBack,
  getActivityTransitionState,
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd,
  onTransitionEnd,
}: {
  dimRef: React.RefObject<HTMLDivElement>;
  edgeRef: React.RefObject<HTMLDivElement>;
  paperRef: React.RefObject<HTMLDivElement>;
  appBarRef?: React.RefObject<HTMLDivElement>;
  offset: number;
  transitionDuration: string;
  preventSwipeBack: boolean;
  getActivityTransitionState: () => ActivityTransitionState | null;
  onSwipeStart?: () => void;
  onSwipeMove?: (args: { dx: number; ratio: number }) => void;
  onSwipeEnd?: (args: { swiped: boolean }) => void;
  onTransitionEnd?: (args: { swiped: boolean }) => void;
}) {
  useStyleEffect({
    styleName: "swipe-back",
    refs: [paperRef],
    effect: ({ refs }) => {
      if (preventSwipeBack) {
        return noop;
      }

      if (!dimRef.current || !edgeRef.current || !paperRef.current) {
        return noop;
      }

      const $dim = dimRef.current;
      const $edge = edgeRef.current;
      const $paper = paperRef.current;
      const $appBarRef = appBarRef?.current;

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

      function movePaper({ dx, ratio }: { dx: number; ratio: number }) {
        if (!_rAFLock) {
          _rAFLock = true;

          requestAnimationFrame(() => {
            $dim.style.opacity = `${1 - ratio}`;
            $dim.style.transition = "0s";

            $paper.style.overflowY = "hidden";
            $paper.style.transform = `translate3d(${dx}px, 0, 0)`;
            $paper.style.transition = "0s";

            $appBarRef?.style.setProperty(
              SWIPE_BACK_RATIO_CSS_VAR_NAME,
              String(ratio),
            );

            refs.forEach((ref) => {
              if (!ref.current) {
                return;
              }

              ref.current.style.transform = `translate3d(${
                -1 * (1 - ratio) * offset
              }px, 0, 0)`;
              ref.current.style.transition = "0s";

              if (ref.current.parentElement?.style.display === "none") {
                ref.current.parentElement.style.display = "block";
              }

              ref.current.parentElement?.style.setProperty(
                SWIPE_BACK_RATIO_CSS_VAR_NAME,
                String(ratio),
              );
            });

            _rAFLock = false;
          });
        }
      }

      function resetPaper({ swiped }: { swiped: boolean }): Promise<void> {
        return new Promise((resolve) => {
          requestAnimationFrame(() => {
            $dim.style.opacity = `${swiped ? 0 : 1}`;
            $dim.style.transition = transitionDuration;

            $paper.style.overflowY = "hidden";
            $paper.style.transform = `translateX(${swiped ? "100%" : "0"})`;
            $paper.style.transition = transitionDuration;

            refs.forEach((ref) => {
              if (!ref.current) {
                return;
              }

              ref.current.style.transition = transitionDuration;
              ref.current.style.transform = `translate3d(${
                swiped ? "0" : `-${offset / 16}rem`
              }, 0, 0)`;
            });

            const _cachedRefs = [...cachedRefs];

            resolve();

            listenOnce($paper, ["transitionend", "transitioncancel"], () => {
              const _swiped =
                swiped ||
                getActivityTransitionState() === "exit-active" ||
                getActivityTransitionState() === "exit-done";

              $dim.style.opacity = "";
              $paper.style.overflowY = "";
              $paper.style.transform = "";

              $appBarRef?.style.removeProperty(SWIPE_BACK_RATIO_CSS_VAR_NAME);

              refs.forEach((ref, i) => {
                if (!ref.current) {
                  return;
                }

                const _cachedRef = _cachedRefs[i];

                if (_swiped) {
                  ref.current.style.transition = "";
                  ref.current.style.transform = "";

                  if (ref.current.parentElement) {
                    ref.current.parentElement.style.display = "";
                  }
                } else if (_cachedRef) {
                  ref.current.style.transition = _cachedRef.style.transition;
                  ref.current.style.transform = _cachedRef.style.transform;

                  if (ref.current.parentElement && _cachedRef.parentElement) {
                    ref.current.parentElement.style.display =
                      _cachedRef.parentElement.style.display;
                  }
                }

                ref.current.parentElement?.style.removeProperty(
                  SWIPE_BACK_RATIO_CSS_VAR_NAME,
                );
              });

              onTransitionEnd?.({ swiped });
            });
          });
        });
      }

      const onTouchStart = (e: TouchEvent) => {
        const { activeElement } = document as any;

        activeElement?.blur?.();

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

        onSwipeStart?.();
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!x0) {
          resetState();
          return;
        }

        x = e.touches[0].clientX;

        const dx = x - x0;
        const ratio = dx / $paper.clientWidth;

        movePaper({ dx, ratio });
        onSwipeMove?.({ dx, ratio });
      };

      const onTouchEnd = () => {
        if (!x0 || !t0 || !x) {
          resetState();
          return;
        }

        const t = Date.now();
        const v = (x - x0) / (t - t0);
        const swiped = v > 1 || x / $paper.clientWidth > 0.4;

        onSwipeEnd?.({ swiped });

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
    },
    effectDeps: [],
  });
}

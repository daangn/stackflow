import type { ActivityTransitionState } from "@stackflow/core";
import type { Accessor } from "solid-js";
import { onCleanup } from "solid-js";

import { createStyleEffect } from "./createStyleEffect";
import { listenOnce } from "./utils";

export function createStyleEffectSwipeBack({
  dimRef,
  edgeRef,
  paperRef,
  offset,
  transitionDuration,
  preventSwipeBack,
  getActivityTransitionState,
  onSwiped,
}: {
  dimRef: Accessor<HTMLDivElement | undefined>;
  edgeRef: Accessor<HTMLDivElement | undefined>;
  paperRef: Accessor<HTMLDivElement | undefined>;
  offset: number;
  transitionDuration: string;
  preventSwipeBack?: Accessor<boolean>;
  getActivityTransitionState: () => ActivityTransitionState | null;
  onSwiped?: () => void;
}) {
  createStyleEffect({
    styleName: "swipe-back",
    refs: [paperRef],
    effect: ({ refs }) => {
      if (preventSwipeBack?.()) {
        return;
      }

      if (!dimRef() || !edgeRef() || !paperRef()) {
        return;
      }

      const $dim = dimRef()!;
      const $edge = edgeRef()!;
      const $paper = paperRef()!;

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
              const $el = ref();
              if (!$el) {
                return;
              }

              $el.style.transform = `translate3d(${
                -1 * (1 - p) * offset
              }px, 0, 0)`;
              $el.style.transition = "0s";

              if ($el.parentElement?.style.display === "none") {
                $el.parentElement.style.display = "block";
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
            $dim.style.transition = transitionDuration;

            $paper.style.overflowY = "hidden";
            $paper.style.transform = `translateX(${swiped ? "100%" : "0"})`;
            $paper.style.transition = transitionDuration;

            refs.forEach((ref) => {
              const $el = ref();
              if (!$el) {
                return;
              }

              $el.style.transition = transitionDuration;
              $el.style.transform = `translate3d(${
                swiped ? "0" : `-${offset / 16}rem`
              }, 0, 0)`;
            });

            const _cachedRefs = [...cachedRefs];

            resolve();

            listenOnce($paper, "transitionend", () => {
              const _swiped =
                swiped ||
                getActivityTransitionState() === "exit-active" ||
                getActivityTransitionState() === "exit-done";

              $dim.style.opacity = "";
              $paper.style.overflowY = "";
              $paper.style.transform = "";

              refs.forEach((ref, i) => {
                const $el = ref();
                if (!$el) {
                  return;
                }

                const _cachedRef = _cachedRefs[i];

                if (_swiped) {
                  $el.style.transition = "";
                  $el.style.transform = "";

                  if ($el.parentElement) {
                    $el.parentElement.style.display = "";
                  }
                } else if (_cachedRef) {
                  $el.style.transition = _cachedRef.style.transition;
                  $el.style.transform = _cachedRef.style.transform;

                  if ($el.parentElement && _cachedRef.parentElement) {
                    $el.parentElement.style.display =
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

        x0 = x = e.touches[0].clientX;
        t0 = Date.now();

        cachedRefs = refs.map((ref) => {
          const $el = ref();
          if (!$el) {
            return {
              style: {
                transform: "",
                transition: "",
              },
            };
          }

          return {
            style: {
              transform: $el.style.transform,
              transition: $el.style.transition,
            },
            parentElement: $el.parentElement
              ? {
                  style: {
                    display: $el.parentElement.style.display,
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

      onCleanup(() => {
        $edge.removeEventListener("touchstart", onTouchStart);
        $edge.removeEventListener("touchmove", onTouchMove);
        $edge.removeEventListener("touchend", onTouchEnd);
        $edge.removeEventListener("touchcancel", onTouchEnd);
      });
    },
  });
}

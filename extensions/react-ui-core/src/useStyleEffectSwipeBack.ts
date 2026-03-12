import type { ActivityTransitionState } from "@stackflow/core";
import { useStyleEffect } from "./useStyleEffect";
import { noop } from "./utils";

export const SWIPE_BACK_RATIO_CSS_VAR_NAME = "--stackflow-swipe-back-ratio";

const SPRING_STIFFNESS = 400;
const DAMPING_COEFFICIENT = 20;
const VELOCITY_THRESHOLD = 800;
const MASS = 1;
const DT = 1000 / 60;

export function useStyleEffectSwipeBack({
  dimRef,
  edgeRef,
  paperRef,
  appBarRef,
  offset,
  transitionDuration,
  preventSwipeBack,
  moveAppBarTogether,
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
  moveAppBarTogether: boolean;
  getActivityTransitionState: () => ActivityTransitionState | null;
  onSwipeStart?: () => void;
  onSwipeMove?: (args: { dx: number; ratio: number }) => void;
  onSwipeEnd?: (args: { swiped: boolean }) => void;
  onTransitionEnd?: (args: { swiped: boolean }) => void;
}) {
  useStyleEffect({
    styleName: "swipe-back",
    refs: moveAppBarTogether && appBarRef ? [paperRef, appBarRef] : [paperRef],
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
      let lastX: number | null = null;
      let lastT: number | null = null;
      let velocity = 0;

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
        lastX = null;
        lastT = null;
        velocity = 0;
        cachedRefs = [];
      };

      let _rAFLock = false;

      function moveActivity({ dx, ratio }: { dx: number; ratio: number }) {
        if (!_rAFLock) {
          _rAFLock = true;

          requestAnimationFrame(() => {
            $dim.style.opacity = `${1 - ratio}`;
            $dim.style.transition = "0s";

            $paper.style.overflowY = "hidden";
            $paper.style.transform = `translate3d(${dx}px, 0, 0)`;
            $paper.style.transition = "0s";

            if (moveAppBarTogether && $appBarRef) {
              $appBarRef.style.overflowY = "hidden";
              $appBarRef.style.transform = `translate3d(${dx}px, 0, 0)`;
              $appBarRef.style.transition = "0s";
            }

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

      function cleanStyles({ swiped }: { swiped: boolean }) {
        const _cachedRefs = [...cachedRefs];

        $dim.style.opacity = "";
        $paper.style.overflowY = "";
        $paper.style.transform = "";
        $paper.style.transition = "";
        
        if (moveAppBarTogether && $appBarRef) {
          $appBarRef.style.overflowY = "";
          $appBarRef.style.transform = "";
          $appBarRef.style.transition = "";
        }
        
        $appBarRef?.style.removeProperty(SWIPE_BACK_RATIO_CSS_VAR_NAME);
        
        refs.forEach((ref, i) => {
          if (!ref.current) return;
          const _cachedRef = _cachedRefs[i];
          
          if (swiped) {
            ref.current.style.transition = "";
            ref.current.style.transform = "";
            if (ref.current.parentElement) {
              ref.current.parentElement.style.display = "";
            }
          } else if (_cachedRef) {
            ref.current.style.transition = _cachedRef.style.transition;
            ref.current.style.transform = _cachedRef.style.transform;
            if (ref.current.parentElement && _cachedRef.parentElement) {
              ref.current.parentElement.style.display = _cachedRef.parentElement.style.display;
            }
          }
          
          ref.current.parentElement?.style.removeProperty(SWIPE_BACK_RATIO_CSS_VAR_NAME);
        });
      }

      function resetActivity({ swiped, initialVelocity }: { swiped: boolean, initialVelocity: number }): Promise<void> {
        return new Promise((resolve) => {
          if (!swiped) {
            requestAnimationFrame(() => {
              $dim.style.opacity = "0";
              $dim.style.transition = "200ms";

              $paper.style.overflowY = "hidden";
              $paper.style.transform = "translate3d(0, 0, 0)";
              $paper.style.transition = "200ms";

              if (moveAppBarTogether && $appBarRef) {
                $appBarRef.style.overflowY = "hidden";
                $appBarRef.style.transform = "translate3d(0, 0, 0)";
                $appBarRef.style.transition = "200ms";
              }

              refs.forEach((ref, i) => {
                if (!ref.current) return;
                if (cachedRefs) {
                  ref.current.style.transition = "transform 0.2s ease-out";
                  ref.current.style.transform = cachedRefs[i].style.transform;
                }
              });

              setTimeout(() => {
                resolve();
              }, 200);
            });

            return;
          }

          let currX = x || 0;
          const targetX = swiped ? $paper.clientWidth : 0;
          let currVelocity = initialVelocity;

          let prevX = currX;

          let lastTimeStamp: DOMHighResTimeStamp | null = null;
          let accumulateTimeStamp = 0;

          let animationId: number | null = null;

          function updatePhysicalQuantity() {
            const displacement = currX - targetX;
            const springForce = -SPRING_STIFFNESS * displacement;
            const dampingForce = -DAMPING_COEFFICIENT * currVelocity;
            const totalForce = springForce + dampingForce;
            const acceleration = totalForce / MASS;

            currVelocity += acceleration * (DT / 1000);
            currX += currVelocity * (DT / 1000);
          }

          function animateSwipeBackSuccess(timeStamp: DOMHighResTimeStamp) {
            if (!animationId) return;

            if (!lastTimeStamp) {
              lastTimeStamp = timeStamp;
              updatePhysicalQuantity();
            }

            const timeElapsed = timeStamp - lastTimeStamp;
            lastTimeStamp = timeStamp;
            accumulateTimeStamp += timeElapsed;

            while (accumulateTimeStamp >= DT) {
              prevX = currX;
              updatePhysicalQuantity();
              accumulateTimeStamp -= DT;
            }

            const alpha = accumulateTimeStamp / DT;
            const renderX = prevX + (currX - prevX) * alpha;
            const ratio = renderX / $paper.clientWidth;

            renderComponent(renderX, ratio);

            if (targetX - currX < 10) {
              renderComponent(targetX, 1);
              resolve();
            } else {
              animationId = requestAnimationFrame(animateSwipeBackSuccess);
            }
          }

          function renderComponent(dx: number, ratio: number) {
            const clampedRatio = Math.max(0, Math.min(1, ratio));

            $dim.style.opacity = `${1 - clampedRatio}`;
            $dim.style.transition = "0s";

            $paper.style.overflowY = "hidden";
            $paper.style.transform = `translate3d(${dx}px, 0, 0)`;
            $paper.style.transition = "0s";

            if (moveAppBarTogether && $appBarRef) {
              $appBarRef.style.overflowY = "hidden";
              $appBarRef.style.transform = `translate3d(${dx}px, 0, 0)`;
              $appBarRef.style.transition = "0s";
            }

            refs.forEach((ref) => {
              if (!ref.current) return;

              const backgroundOffset = -1 * (1 - clampedRatio) * offset;
              ref.current.style.transform = `translate3d(${backgroundOffset}px, 0, 0)`;
              ref.current.style.transition = "0s";

              if (ref.current.parentElement?.style.display === "none") {
                ref.current.parentElement.style.display = "block";
              }

              ref.current.parentElement?.style.setProperty(
                SWIPE_BACK_RATIO_CSS_VAR_NAME,
                String(clampedRatio),
              );
            });
          }

          animationId = requestAnimationFrame(animateSwipeBackSuccess);
        });
      }

      const onTouchStart = (e: TouchEvent) => {
        const { activeElement } = document as any;

        activeElement?.blur?.();

        x0 = x = lastX = e.touches[0].clientX;
        t0 = lastT = Date.now();
        velocity = 0;

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
        if (!x0 || !lastX || !lastT) {
          resetState();
          return;
        }

        const currTime = Date.now();
        x = e.touches[0].clientX;

        const dt = (currTime - lastT) / 1000;
        if (dt > 0) {
          const instantVelocity = (x - lastX) / dt;
          velocity = velocity * 0.7 + instantVelocity * 0.3;
        }
      
        const dx = x - x0;
        const ratio = dx / $paper.clientWidth;

        moveActivity({ dx, ratio });
        onSwipeMove?.({ dx, ratio });

        lastX = x;
        lastT = currTime;
      };

      const onTouchEnd = () => {
        if (!x0 || !t0 || !x) {
          resetState();
          return;
        }

        const displacement = x - x0;
        const ratio = displacement / $paper.clientWidth;

        const swiped = (velocity > VELOCITY_THRESHOLD && displacement > 0) || ratio > 0.4;

        onSwipeEnd?.({ swiped })

        Promise.resolve()
          .then(() => resetActivity({ swiped, initialVelocity: velocity }))
          .then(() => onTransitionEnd?.({ swiped }))
          // wait for unmount
          .then(() => new Promise(
            resolve => requestAnimationFrame(() => resolve(undefined))
          ))
          .then(() => cleanStyles({ swiped }))
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
    effectDeps: [preventSwipeBack],
  });
}

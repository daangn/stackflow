import type React from "react";
import { useEffect, useRef } from "react";

import { noop } from "./noop";

const MAX_FRAME_OFFSET = 80;
const css = String.raw;

function set(cssText: string, el?: HTMLElement | null) {
  if (el) {
    // eslint-disable-next-line no-param-reassign
    el.style.cssText = cssText;
  }
}

export function useSwipeBack({
  dimRef,
  appScreenRef,
  appScreenPaperRef,
  edgeRef,
  getBeforeAppScreen,
  getBeforeAppScreenPaper,
  transitionDuration,
  onBack,
}: {
  dimRef: React.MutableRefObject<any>;
  appScreenRef: React.MutableRefObject<any>;
  appScreenPaperRef: React.MutableRefObject<any>;
  edgeRef: React.MutableRefObject<any>;
  getBeforeAppScreen: () => HTMLElement | null | undefined;
  getBeforeAppScreenPaper: () => HTMLElement | null | undefined;
  transitionDuration: number;
  onBack: () => void;
}) {
  useEffect(() => {
    const $dim = dimRef.current;
    const $appScreenPaper = appScreenPaperRef.current;
    const $edge = edgeRef.current;
    const $beforeAppScreen = getBeforeAppScreen();
    const $beforeAppScreenPaper = getBeforeAppScreenPaper();

    if (!$dim || !$appScreenPaper || !$edge) {
      return noop;
    }

    let _rAFLock = false;

    function translate({ dx }: { dx: number }) {
      if (!_rAFLock) {
        _rAFLock = true;

        requestAnimationFrame(() => {
          const p = dx / $appScreenPaper.clientWidth;

          set(
            css`
              opacity: ${1 - p};
              transition: opacity 0s;
            `,
            $dim,
          );
          set(
            css`
              overflow-y: hidden;
              transform: translateX(${dx}px);
              transition: transform 0s;
            `,
            $appScreenPaper,
          );
          set(
            css`
              transform: translateX(${-1 * (1 - p) * MAX_FRAME_OFFSET}px);
              transition: transform 0s;
            `,
            $beforeAppScreenPaper,
          );

          if ($beforeAppScreen) {
            $beforeAppScreen.style.display = "block";
          }

          _rAFLock = false;
        });
      }
    }

    function resetTranslation({ ok }: { ok: boolean }) {
      requestAnimationFrame(() => {
        set(
          css`
            opacity: ${ok ? 0 : 1};
            transition: opacity ${transitionDuration}ms;
          `,
          $dim,
        );
        set(
          css`
            overflow-y: hidden;
            transform: translateX(${ok ? "100%" : "0"});
            transition: transform ${transitionDuration}ms;
          `,
          $appScreenPaper,
        );
        set(
          css`
            transform: translateX(${ok ? "0" : "-5rem"});
            transition: transform ${transitionDuration}ms;
          `,
          $beforeAppScreenPaper,
        );

        setTimeout(() => {
          set("", $dim);
          set("", $appScreenPaper);
          set("", $beforeAppScreenPaper);

          if ($beforeAppScreen) {
            $beforeAppScreen.style.display = "";
          }
        }, transitionDuration);
      });
    }

    let x0: number | null = null;
    let t0: number | null = null;
    let x: number | null = null;

    const resetState = () => {
      x0 = null;
      t0 = null;
      x = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      const { activeElement } = document as any;

      activeElement?.blur?.();
      // eslint-disable-next-line no-multi-assign
      x0 = x = e.touches[0].clientX;
      t0 = Date.now();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!x0) {
        resetState();
        return;
      }

      x = e.touches[0].clientX;

      translate({
        dx: x - x0,
      });
    };

    const onTouchEnd = () => {
      if (!x0 || !t0 || !x) {
        resetState();
        return;
      }

      const t = Date.now();
      const v = (x - x0) / (t - t0);
      const ok = v > 1 || x / $appScreenPaper.clientWidth > 0.4;

      if (ok) {
        onBack();
      }

      resetState();
      resetTranslation({ ok });
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
  }, [dimRef, appScreenPaperRef, edgeRef, onBack]);
}

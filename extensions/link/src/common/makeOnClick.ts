import type React from "react";

export const makeOnClick =
  <
    T extends
      | (MouseEvent & { currentTarget: HTMLAnchorElement })
      | React.MouseEvent<HTMLAnchorElement>,
  >(options: {
    activityName: string;
    activityParams: Record<string, string | undefined>;
    actions: {
      push: (
        activityName: string,
        activityParams: Record<string, string | undefined>,
        options?: { animate?: boolean },
      ) => void;
      replace: (
        activityName: string,
        activityParams: Record<string, string | undefined>,
        options?: { animate?: boolean },
      ) => void;
    };
    animate?: boolean;
    replace?: boolean;
    onClick?: (e: T) => void;
  }) =>
  (e: T) => {
    if (options.onClick) {
      options.onClick(e);
    }

    const which = "nativeEvent" in e ? e.nativeEvent.which : e.which;

    if (
      (e.button === 0 &&
        !(e.currentTarget.target && e.currentTarget.target !== "_self")) ||
      (!e.defaultPrevented &&
        !e.metaKey &&
        !e.altKey && // triggers resource download
        !e.ctrlKey &&
        !e.shiftKey &&
        !(which === 2))
    ) {
      e.preventDefault();

      if (options.replace) {
        options.actions.replace(
          options.activityName,
          options.activityParams,
          typeof options.animate === "undefined" || options.animate === null
            ? {}
            : { animate: options.animate },
        );
      } else {
        options.actions.push(
          options.activityName,
          options.activityParams,
          typeof options.animate === "undefined" || options.animate === null
            ? {}
            : { animate: options.animate },
        );
      }
    }
  };

import {
  makeTemplate,
  normalizeRoute,
  useRoutes,
} from "@stackflow/plugin-history-sync";
import { usePreloader } from "@stackflow/plugin-preload";
import type { ActivityComponentType } from "@stackflow/react";
import { useActions } from "@stackflow/react";
import { forwardRef, useEffect, useMemo, useReducer, useRef } from "react";

import { mergeRefs } from "./mergeRefs";
import { omit } from "./omit";

export type AnchorProps = Omit<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
  "ref" | "href"
>;

export type LinkProps<K, P> = {
  activityName: K;
  activityParams: P;
  animate?: boolean;
  replace?: boolean;
} & AnchorProps;

export type TypeLink<T extends { [activityName: string]: unknown } = {}> = <
  K extends Extract<keyof T, string>,
>(
  props: LinkProps<K, T[K] extends ActivityComponentType<infer U> ? U : never>,
) => React.ReactElement | null;

export const Link: TypeLink = forwardRef(
  (props, ref: React.ForwardedRef<HTMLAnchorElement>) => {
    const routes = useRoutes();
    const { preload } = usePreloader();
    const { push, replace } = useActions();

    const anchorRef = useRef<HTMLAnchorElement>(null);
    const [preloaded, flagPreloaded] = useReducer(() => true, false);

    const href = useMemo(() => {
      const route = routes[props.activityName];

      if (!route) {
        return undefined;
      }

      const template = makeTemplate(normalizeRoute(route)[0]);
      const path = template.fill(props.activityParams);

      return path;
    }, [routes, props.activityName, props.activityParams]);

    useEffect(() => {
      if (preloaded || !anchorRef.current) {
        return () => {};
      }

      const $anchor = anchorRef.current;

      const observer = new IntersectionObserver(([{ isIntersecting }]) => {
        if (isIntersecting) {
          preload(props.activityName, props.activityParams, {
            activityContext: {
              path: href,
            },
          });
          flagPreloaded();
        }
      });

      observer.observe($anchor);

      return () => {
        observer.unobserve($anchor);
        observer.disconnect();
      };
    }, [anchorRef, flagPreloaded]);

    const anchorProps = omit(props, [
      "activityName",
      "activityParams",
      "animate",
      "onClick",
    ]);

    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.onClick) {
        props.onClick(e);
      }

      if (
        (e.button === 0 &&
          !(e.currentTarget.target && e.currentTarget.target !== "_self")) ||
        (!e.defaultPrevented &&
          !e.metaKey &&
          !e.altKey && // triggers resource download
          !e.ctrlKey &&
          !e.shiftKey &&
          !(e.nativeEvent && e.nativeEvent.which === 2))
      ) {
        e.preventDefault();

        if (props.replace) {
          replace(
            props.activityName,
            props.activityParams,
            typeof props.animate === "undefined" || props.animate === null
              ? {}
              : { animate: props.animate },
          );
        } else {
          push(
            props.activityName,
            props.activityParams,
            typeof props.animate === "undefined" || props.animate === null
              ? {}
              : { animate: props.animate },
          );
        }
      }
    };

    return (
      <a
        ref={mergeRefs(ref, anchorRef)}
        href={href}
        onClick={onClick}
        {...anchorProps}
      >
        {props.children}
      </a>
    );
  },
);

(Link as any).displayName = "Link";

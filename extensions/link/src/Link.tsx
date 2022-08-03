import {
  makeTemplate,
  normalizeRoute,
  useRoutes,
} from "@stackflow/plugin-history-sync";
import { usePreloader } from "@stackflow/plugin-preload";
import type { ActivityComponentType } from "@stackflow/react";
import { useActions } from "@stackflow/react";
import React, { useEffect, useMemo, useReducer, useRef } from "react";

import { omit } from "./omit";

export type AnchorProps = Omit<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
  "ref"
>;

export type LinkProps<K extends string, P> = {
  activityName: K;
  activityParams: P;
  animate?: boolean;
} & AnchorProps;

export type TypeLink<T extends { [activityName: string]: unknown }> = <
  K extends Extract<keyof T, string>,
>(
  props: LinkProps<K, T[K] extends ActivityComponentType<infer U> ? U : never>,
) => React.ReactElement | null;

export const Link: TypeLink<{}> = React.forwardRef(
  (props: LinkProps, ref: React.ForwardedRef<HTMLAnchorElement>) => {
    const routes = useRoutes();

    const [preloaded, flagPreloaded] = useReducer(() => true, false);
    const { preload } = usePreloader();

    const { push } = useActions();

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
      if (preloaded || !ref || !("current" in ref) || !ref.current) {
        return () => {};
      }

      const $anchor = ref.current;

      const observer = new IntersectionObserver(([{ isIntersecting }]) => {
        if (isIntersecting) {
          preload(props.activityName, props.activityParams, {
            eventContext: {
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
    }, [ref, flagPreloaded]);

    const anchorProps = useMemo(
      () => omit(props, ["activityName", "activityParams", "animate"]),
      [props],
    );

    return (
      <a
        ref={ref}
        href={href}
        onClick={(e) => {
          e.preventDefault();

          push(
            props.activityName,
            props.activityParams,
            typeof props.animate === "undefined" || props.animate === null
              ? {}
              : { animate: props.animate },
          );
        }}
        {...anchorProps}
      >
        {props.children}
      </a>
    );
  },
);

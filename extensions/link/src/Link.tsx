import {
  makeTemplate,
  normalizeRoute,
  useRoutes,
} from "@stackflow/plugin-history-sync";
import type { ActivityComponentType } from "@stackflow/react";
import React, { useEffect, useMemo, useReducer, useRef } from "react";

import { omit } from "./omit";
import { usePreloader } from "./usePreloader";

export type AnchorProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>;

export type LinkProps<
  T extends { [activityName: string]: ActivityComponentType },
  K extends string,
> = {
  activityName: K;
  activityParams: T[K] extends ActivityComponentType<infer U> ? U : never;
} & AnchorProps;

export function Link<
  T extends { [activityName: string]: ActivityComponentType },
>(props: LinkProps<T, Extract<keyof T, string>>) {
  const routes = useRoutes();
  const { preload } = usePreloader();

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
  }, [anchorRef, flagPreloaded]);

  const anchorProps = useMemo(
    () => omit(props, ["activityName", "activityParams"]),
    [props],
  );

  return (
    <a href={href} {...anchorProps}>
      {props.children}
    </a>
  );
}

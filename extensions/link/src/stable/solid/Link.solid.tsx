/** @jsxImportSource solid-js */

import type { UrlPatternOptions } from "@stackflow/plugin-history-sync/solid";
import { makeTemplate, useRoutes } from "@stackflow/plugin-history-sync/solid";
import { usePreloader } from "@stackflow/plugin-preload/solid";
import type { ActivityComponentType } from "@stackflow/solid";
import { useActions } from "@stackflow/solid";
import {
  type JSX,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  splitProps,
} from "solid-js";

import { makeOnClick } from "../../common/makeOnClick";

export type AnchorProps = Omit<
  JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "onClick"
>;

export type LinkProps<K, P> = {
  activityName: K;
  activityParams: P;
  animate?: boolean;
  replace?: boolean;
  urlPatternOptions?: UrlPatternOptions;
  onClick?: (
    e: MouseEvent & { currentTarget: HTMLAnchorElement; target: Element },
  ) => void;
} & AnchorProps;

export type TypeLink<T extends { [activityName: string]: unknown } = {}> = <
  K extends Extract<keyof T, string>,
>(
  props: LinkProps<K, T[K] extends ActivityComponentType<infer U> ? U : never>,
) => JSX.Element;

export const Link: TypeLink = (props) => {
  const [locals, others] = splitProps(props, [
    "ref",
    "children",

    // Custom Props
    "activityName",
    "activityParams",
    "animate",
    "replace",
    "urlPatternOptions",

    // Overriden Props
    "onClick",
  ]);

  const routes = useRoutes();
  const preloader = usePreloader({
    get urlPatternOptions() {
      return locals.urlPatternOptions;
    },
  });
  const actions = useActions();

  const [anchorRef, setAnchorRef] = createSignal<HTMLAnchorElement>();
  const [preloaded, setPreloaded] = createSignal(false);

  const match = createMemo(() =>
    routes.find((r) => r.activityName === locals.activityName),
  );
  const href = createMemo(() => {
    const m = match();

    if (!m) {
      return undefined;
    }

    const template = makeTemplate(m, locals.urlPatternOptions);
    const path = template.fill(locals.activityParams);

    return path;
  });

  createEffect(() => {
    const $anchor = anchorRef();

    if (preloaded() || !$anchor) {
      return;
    }

    const observer = new IntersectionObserver(([{ isIntersecting }]) => {
      if (isIntersecting) {
        preloader().preload(locals.activityName, locals.activityParams, {
          activityContext: {
            path: href(),
          },
        });
        setPreloaded(true);
      }
    });

    observer.observe($anchor);

    onCleanup(() => {
      observer.unobserve($anchor);
      observer.disconnect();
    });
  });

  const onClick = createMemo(() =>
    makeOnClick({
      activityName: locals.activityName,
      activityParams: locals.activityParams,
      actions,
      animate: locals.animate,
      replace: locals.replace,
      onClick: locals.onClick,
    }),
  );

  return (
    <a
      ref={(el) => {
        setAnchorRef(el);
        (locals.ref as ((el: HTMLAnchorElement) => void) | undefined)?.(el);
      }}
      href={href()}
      onClick={onClick()}
      draggable="false" // Disable long press behavior by default in iOS
      {...others}
    >
      {locals.children}
    </a>
  );
};

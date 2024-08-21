/// <reference types="@stackflow/plugin-history-sync" />

import type {
  InferActivityParams,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import { useConfig, useFlow } from "@stackflow/react/future";
import { useMemo } from "react";
import { omit } from "./omit";

type AnchorProps = Omit<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
  "ref" | "href"
>;

export interface LinkProps<
  K extends Extract<keyof RegisteredActivityParamTypes, string>,
> extends AnchorProps {
  ref?: React.RefObject<HTMLAnchorElement>;
  activityName: K;
  activityParams: InferActivityParams<K>;
  animate?: boolean;
  replace?: boolean;
}

export function Link<
  K extends Extract<keyof RegisteredActivityParamTypes, string>,
>(props: LinkProps<K>) {
  const config = useConfig();
  const { push, replace } = useFlow();

  const href = useMemo(() => {
    const match = config.activities.find((r) => r.name === props.activityName);

    if (
      !match ||
      !match.path ||
      typeof match.path !== "string" ||
      !config["@stackflow/plugin-history-sync"]
    ) {
      return "#";
    }

    const { makeTemplate, options } = config["@stackflow/plugin-history-sync"];

    const template = makeTemplate(
      { path: match.path },
      options.urlPatternOptions,
    );
    const path = template.fill(props.activityParams);

    return path;
  }, [config, props.activityName, props.activityParams]);

  const anchorProps = omit(props, [
    // Custom Props
    "activityName",
    "activityParams",
    "animate",
    "replace",

    // Overriden Props
    "onClick",
  ]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (props.onClick) {
      props.onClick(e);
    }

    /**
     * https://github.com/gatsbyjs/gatsby/blob/33f18ba7a98780a887d33e72936da57a6c58932a/packages/gatsby-link/src/index.js#L182-L190
     */
    if (
      e.button === 0 && // ignore right clicks
      !props.target && // let browser handle "target=_blank"
      !e.defaultPrevented && // onClick prevented default
      !e.metaKey && // ignore clicks with modifier keys...
      !e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey
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
    <a ref={props.ref} href={href} onClick={onClick} {...anchorProps}>
      {props.children}
    </a>
  );
}

Link.displayName = "Link";

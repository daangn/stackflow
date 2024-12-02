/// <reference types="@stackflow/plugin-history-sync" />

import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useConfig, useFlow } from "@stackflow/react/future";
import { useMemo } from "react";

import { makeOnClick } from "../../common/makeOnClick";
import { omit } from "./omit";

type AnchorProps = Omit<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
  "ref" | "href"
>;

export interface LinkProps<K extends RegisteredActivityName>
  extends AnchorProps {
  ref?: React.RefObject<HTMLAnchorElement>;
  activityName: K;
  activityParams: InferActivityParams<K>;
  animate?: boolean;
  replace?: boolean;
}

export function Link<K extends RegisteredActivityName>(props: LinkProps<K>) {
  const config = useConfig();
  const actions = useFlow();

  const href = useMemo(() => {
    const match = config.activities.find((r) => r.name === props.activityName);

    if (
      !match ||
      !match.path ||
      typeof match.path !== "string" ||
      !config.historySync
    ) {
      return undefined;
    }

    const { path } = match;
    const { makeTemplate, urlPatternOptions } = config.historySync;

    const template = makeTemplate({ path }, urlPatternOptions);

    return template.fill(props.activityParams);
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

  const onClick = makeOnClick<React.MouseEvent<HTMLAnchorElement>>({
    activityName: props.activityName,
    activityParams: props.activityParams,
    actions,
    animate: props.animate,
    replace: props.replace,
    onClick: props.onClick,
  });

  return (
    <a
      ref={props.ref}
      href={href}
      onClick={onClick}
      draggable="false" // Disable long press behavior by default in iOS
      {...anchorProps}
    >
      {props.children}
    </a>
  );
}

Link.displayName = "Link";

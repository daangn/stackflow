/* @jsxImportSource solid-js */
/// <reference types="@stackflow/plugin-history-sync" />

import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useConfig, useFlow } from "@stackflow/solid/future";
import { type JSX, createMemo, splitProps } from "solid-js";

import { makeOnClick } from "../../common/makeOnClick";

type AnchorProps = Omit<
  JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "onClick"
>;

export interface LinkProps<K extends RegisteredActivityName>
  extends AnchorProps {
  activityName: K;
  activityParams: InferActivityParams<K>;
  animate?: boolean;
  replace?: boolean;
  onClick?: (
    e: MouseEvent & { currentTarget: HTMLAnchorElement; target: Element },
  ) => void;
}

export function Link<K extends RegisteredActivityName>(props: LinkProps<K>) {
  const [locals, others] = splitProps(props, [
    "ref",
    "children",

    // Custom Props
    "activityName",
    "activityParams",
    "animate",
    "replace",

    // Overriden Props
    "onClick",
  ]);

  const config = useConfig();
  const actions = useFlow();

  const match = createMemo(() =>
    config?.activities.find((r) => r.name === locals.activityName),
  );
  const href = createMemo(() => {
    const m = match();

    if (!m || !m.path || typeof m.path !== "string" || !config?.historySync) {
      return undefined;
    }

    const { makeTemplate, urlPatternOptions } = config.historySync;

    const template = makeTemplate({ path: m.path }, urlPatternOptions);

    return template.fill(locals.activityParams);
  });

  const onClick = createMemo(() =>
    makeOnClick({
      activityName: props.activityName,
      activityParams: props.activityParams,
      actions,
      animate: props.animate,
      replace: props.replace,
      onClick: props.onClick,
    }),
  );

  return (
    <a
      ref={locals.ref}
      href={href()}
      onClick={onClick()}
      draggable="false" // Disable long press behavior by default in iOS
      {...others}
    >
      {locals.children}
    </a>
  );
}

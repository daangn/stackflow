import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { useFlow } from "@stackflow/react";
import { useContext, useMemo } from "react";
import { LinkUrlResolverContext } from "./LinkUrlResolverContext";
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
  const urlResolver = useContext(LinkUrlResolverContext);
  const { push, replace } = useFlow();

  const href = useMemo(() => {
    if (urlResolver === null) {
      return undefined;
    }

    return urlResolver.makeActivityUrl(
      props.activityName,
      props.activityParams,
    );
  }, [urlResolver, props.activityName, props.activityParams]);

  if (urlResolver === null) {
    throw new Error(
      "Link must be rendered inside a LinkUrlResolverContext.Provider.",
    );
  }

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

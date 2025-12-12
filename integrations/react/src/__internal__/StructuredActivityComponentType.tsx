import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ComponentType, ReactNode } from "react";
import { optimizableLazyComponent } from "./utils/OptimizableLazyComponent";
import { preloadableLazyComponent } from "./utils/PreloadableLazyComponent";
import {
  inspect,
  liftValue,
  PromiseStatus,
  type SyncInspectablePromise,
} from "./utils/SyncInspectablePromise";

export const STRUCTURED_ACTIVITY_COMPONENT_TYPE: unique symbol = Symbol(
  "STRUCTURED_ACTIVITY_COMPONENT_TYPE",
);

export interface StructuredActivityComponentType<P extends {}> {
  [STRUCTURED_ACTIVITY_COMPONENT_TYPE]: true;
  content: Content<P> | (() => Promise<{ default: Content<P> }>);
  layout?: Layout<P>;
  loading?: Loading<P>;
  errorHandler?: ErrorHandler<P>;
}

export function structuredActivityComponent<
  ActivityName extends RegisteredActivityName,
>(options: {
  content:
    | Content<InferActivityParams<ActivityName>>
    | (() => Promise<{ default: Content<InferActivityParams<ActivityName>> }>);
  layout?: Layout<InferActivityParams<ActivityName>>;
  loading?: Loading<InferActivityParams<ActivityName>>;
  errorHandler?: ErrorHandler<InferActivityParams<ActivityName>>;
}): StructuredActivityComponentType<InferActivityParams<ActivityName>> {
  let cachedContent: SyncInspectablePromise<{
    default: Content<InferActivityParams<ActivityName>>;
  }> | null = null;

  return {
    ...options,
    content: () => {
      if (typeof options.content !== "function")
        return liftValue({ default: options.content });

      if (
        !cachedContent ||
        inspect(cachedContent).status === PromiseStatus.REJECTED
      ) {
        cachedContent = liftValue(options.content());
      }

      return cachedContent;
    },
    [STRUCTURED_ACTIVITY_COMPONENT_TYPE]: true,
  };
}

export function isStructuredActivityComponent(
  value: unknown,
): value is StructuredActivityComponentType<{}> {
  return (
    value !== null &&
    typeof value === "object" &&
    STRUCTURED_ACTIVITY_COMPONENT_TYPE in value
  );
}

export interface Content<P extends {}> {
  component: ComponentType<{ params: P }>;
}

export function content<ActivityName extends RegisteredActivityName>(
  component: ComponentType<{ params: InferActivityParams<ActivityName> }>,
): Content<InferActivityParams<ActivityName>> {
  return { component };
}

const ContentComponentMap = new WeakMap<
  StructuredActivityComponentType<{}>,
  Content<{}>["component"]
>();

export function getContentComponent(
  structuredActivityComponent: StructuredActivityComponentType<{}>,
): Content<{}>["component"] {
  if (ContentComponentMap.has(structuredActivityComponent)) {
    return ContentComponentMap.get(structuredActivityComponent)!;
  }

  const { Component: ContentComponent } = preloadableLazyComponent(() => {
    const content = structuredActivityComponent.content;
    const contentPromise = liftValue(
      typeof content === "function" ? content() : { default: content },
    );
    const state = inspect(contentPromise);

    if (state.status === PromiseStatus.FULFILLED) {
      return liftValue({
        default: state.value.default.component,
      });
    }

    return liftValue(
      contentPromise.then((value) => ({
        default: value.default.component,
      })),
    );
  });

  ContentComponentMap.set(structuredActivityComponent, ContentComponent);

  return ContentComponent;
}

export interface Layout<P extends {}> {
  component: ComponentType<{ params: P; children: ReactNode }>;
}

export function layout<ActivityName extends RegisteredActivityName>(
  component: ComponentType<{
    params: InferActivityParams<ActivityName>;
    children: ReactNode;
  }>,
): Layout<InferActivityParams<ActivityName>> {
  return { component };
}

export interface Loading<P extends {}> {
  component: ComponentType<{ params: P }>;
}

export function loading<ActivityName extends RegisteredActivityName>(
  component: ComponentType<{ params: InferActivityParams<ActivityName> }>,
): Loading<InferActivityParams<ActivityName>> {
  return { component };
}

export interface ErrorHandler<P extends {}> {
  component: ComponentType<{ params: P; error: unknown; reset: () => void }>;
  boundary?: CustomErrorBoundary;
}

export type CustomErrorBoundary = ComponentType<{
  children: ReactNode;
  renderFallback: (error: unknown, reset: () => void) => ReactNode;
}>;

export function errorHandler<ActivityName extends RegisteredActivityName>(
  component: ComponentType<{
    params: InferActivityParams<ActivityName>;
    error: unknown;
    reset: () => void;
  }>,
  options?: {
    boundary?: CustomErrorBoundary;
  },
): ErrorHandler<InferActivityParams<ActivityName>> {
  return { component, boundary: options?.boundary };
}

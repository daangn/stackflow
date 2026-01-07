import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ComponentType, ReactNode } from "react";
import { preloadableLazyComponent } from "./utils/PreloadableLazyComponent";
import {
  inspect,
  PromiseStatus,
  reject,
  resolve,
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
  return {
    ...options,
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
  { Component: Content<{}>["component"]; preload: () => Promise<void> }
>();

export function getContentComponent(
  structuredActivityComponent: StructuredActivityComponentType<{}>,
): { Component: Content<{}>["component"]; preload: () => Promise<void> } {
  if (ContentComponentMap.has(structuredActivityComponent)) {
    return ContentComponentMap.get(structuredActivityComponent)!;
  }

  const { Component, preload } = preloadableLazyComponent(() => {
    const content = structuredActivityComponent.content;
    const contentPromise = resolve(
      typeof content === "function" ? content() : { default: content },
    );
    const state = inspect(contentPromise);

    if (state.status === PromiseStatus.FULFILLED) {
      return resolve({
        default: state.value.default.component,
      });
    } else if (state.status === PromiseStatus.REJECTED) {
      return reject(state.reason);
    }

    return resolve(
      contentPromise.then((value) => ({
        default: value.default.component,
      })),
    );
  });

  ContentComponentMap.set(structuredActivityComponent, { Component, preload });

  return { Component, preload };
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

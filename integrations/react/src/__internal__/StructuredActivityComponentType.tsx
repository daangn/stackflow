import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import { type ComponentType, lazy, type ReactNode } from "react";

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
  Content<{}>["component"]
>();

export function getContentComponent(
  structuredActivityComponent: StructuredActivityComponentType<{}>,
): Content<{}>["component"] {
  const content = structuredActivityComponent.content;

  if (ContentComponentMap.has(structuredActivityComponent)) {
    return ContentComponentMap.get(structuredActivityComponent)!;
  }

  const ContentComponent =
    "component" in content
      ? content.component
      : lazy(async () => {
          const {
            default: { component: Component },
          } = await content();
          return { default: Component };
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
}

export function errorHandler<ActivityName extends RegisteredActivityName>(
  component: ComponentType<{
    params: InferActivityParams<ActivityName>;
    error: unknown;
    reset: () => void;
  }>,
): ErrorHandler<InferActivityParams<ActivityName>> {
  return { component };
}

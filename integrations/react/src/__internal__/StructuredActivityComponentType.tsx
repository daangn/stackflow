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
>(
  options: StructuredActivityComponentType<InferActivityParams<ActivityName>>,
): StructuredActivityComponentType<InferActivityParams<ActivityName>> {
  return options;
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

export function getContentComponent<P extends {}>(
  structuredActivityComponent: StructuredActivityComponentType<P>,
): Content<P>["component"] {
  const content = structuredActivityComponent.content;

  return "component" in content
    ? content.component
    : lazy(async () => {
        const {
          default: { component: Component },
        } = await content();
        return { default: Component };
      });
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

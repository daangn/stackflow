import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ComponentType, ReactNode } from "react";
import type { MonolithicActivityComponentType } from "./MonolithicActivityComponentType";

export interface StructuredActivityComponentType<P extends {}> {
  content: Content<P>;
  layout?: Layout<P>;
  loading?: Loading<P>;
  errorHandler?: ErrorHandler<P>;
}

export interface Content<P extends {}> {
  component: MonolithicActivityComponentType<P>;
}

export function content<ActivityName extends RegisteredActivityName>(
  component: MonolithicActivityComponentType<InferActivityParams<ActivityName>>,
): Content<InferActivityParams<ActivityName>> {
  return { component };
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

import type { ComponentType, ReactNode } from "react";
import type { MonolithicActivityComponentType } from "./MonolithicActivityComponentType";

export interface StructuredActivityComponentType<P extends {}> {
  content: MonolithicActivityComponentType<P>;
  layout?: ComponentType<{ params: P; children: ReactNode }>;
  loading?: ComponentType<{ params: P }>;
  error?: ComponentType<{ params: P; error: unknown; reset: () => void }>;
}

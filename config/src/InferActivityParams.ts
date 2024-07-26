import type { z } from "zod";
import type { ActivityDefinition } from "./ActivityDefinition";

export type InferActivityParams<A extends ActivityDefinition<any, any>> =
  A extends ActivityDefinition<any, infer S>
    ? keyof z.infer<S> extends never
      ? { [key: string]: string | undefined }
      : z.infer<S>
    : never;

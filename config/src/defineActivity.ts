import { z } from "zod";
import type { ActivityBaseSchema } from "./ActivityBaseSchema";
import type { ActivityDefinition } from "./ActivityDefinition";

export function defineActivity<
  Name extends string,
  Schema extends ActivityBaseSchema,
>(activity: ActivityDefinition<Name, Schema>) {
  return activity;
}

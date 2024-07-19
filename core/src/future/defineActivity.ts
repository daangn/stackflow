import type { ActivityDefinition } from "./ActivityDefinition";
import type { BaseParams } from "./BaseParams";

export function defineActivity<Name extends string, Params extends BaseParams>(
  activity: ActivityDefinition<Name, Params>,
) {
  return activity;
}

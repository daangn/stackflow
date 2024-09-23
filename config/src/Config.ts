import type { ActivityDefinition } from "./ActivityDefinition";
import type { RegisterActivityLoaderArgs } from "./RegisterActivityLoaderArgs";

interface ActivityLoaderArgsConfig {
  activityLoaderArgs: RegisterActivityLoaderArgs;
}

export type Config<T extends ActivityDefinition<string>> = {
  activities: T[];
  transitionDuration: number;
  initialActivity?: () => T["name"];
} & (keyof RegisterActivityLoaderArgs extends never
  ? {}
  : ActivityLoaderArgsConfig);

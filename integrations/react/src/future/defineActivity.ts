import type { ActivityComponentType as InternalActivityComponentType } from "../__internal__/ActivityComponentType";

export type ActivityRoute =
  | string
  | {
      path: string;
      decode?: (params: Record<string, string | undefined>) => unknown;
      defaultHistory?: () => Array<{
        activityName: string;
        activityParams: Record<string, unknown>;
      }>;
    };

export type ActivityLoader<TParams> = (args: {
  params: TParams;
  config: {
    activities: Array<{ name: string; route?: ActivityRoute }>;
    transitionDuration: number;
  };
}) => unknown;

export interface ActivityDefinitionInput<TParams extends Record<string, unknown>> {
  component: InternalActivityComponentType<TParams>;
  route?: ActivityRoute;
  loader?: ActivityLoader<TParams>;
  transition?: "slide" | "modal" | "bottomSheet" | "fade";
}

export interface ActivityDefinitionOutput<
  TName extends string,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> {
  name: TName;
  component: InternalActivityComponentType<TParams>;
  route?: ActivityRoute;
  loader?: ActivityLoader<TParams>;
  transition?: "slide" | "modal" | "bottomSheet" | "fade";
  __params?: TParams;
}

export function defineActivity<TName extends string>(name: TName) {
  return <TParams extends Record<string, unknown> = Record<string, never>>(
    input: ActivityDefinitionInput<TParams>,
  ): ActivityDefinitionOutput<TName, TParams> => ({
    name,
    ...input,
  });
}

export type DestinationsMap = {
  [name: string]: ActivityDefinitionOutput<string, any> | NavigationDefinitionOutput<string, any>;
};

export interface NavigationDefinitionOutput<
  TName extends string,
  TActivities extends DestinationsMap = DestinationsMap,
> {
  __type: "navigation";
  name: TName;
  activities: TActivities;
  initialActivity: Extract<keyof TActivities, string>;
}

export function defineNavigation<TName extends string>(name: TName) {
  return <TActivities extends DestinationsMap>(input: {
    activities: TActivities;
    initialActivity: Extract<keyof TActivities, string>;
  }): NavigationDefinitionOutput<TName, TActivities> => ({
    __type: "navigation",
    name,
    ...input,
  });
}

export function isNavigationDefinition(
  def: ActivityDefinitionOutput<string, any> | NavigationDefinitionOutput<string, any>,
): def is NavigationDefinitionOutput<string, any> {
  return "__type" in def && def.__type === "navigation";
}

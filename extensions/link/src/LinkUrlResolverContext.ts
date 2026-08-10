import { createContext } from "react";

export interface LinkUrlResolver {
  readonly makeActivityUrl: (
    activityName: string,
    activityParams: Record<string, any>,
  ) => string;
}

export const LinkUrlResolverContext = createContext<LinkUrlResolver | null>(
  null,
);

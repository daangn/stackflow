import { createContext, type ReactNode, useContext } from "react";

export interface LinkUrlResolver {
  readonly makeActivityUrl: (
    activityName: string,
    activityParams: Record<string, any>,
  ) => string;
}

export const LinkUrlResolverContext = createContext<LinkUrlResolver | null>(
  null,
);

export function LinkUrlResolverProvider({
  resolver,
  children,
}: {
  resolver: LinkUrlResolver;
  children: ReactNode;
}) {
  return (
    <LinkUrlResolverContext.Provider value={resolver}>
      {children}
    </LinkUrlResolverContext.Provider>
  );
}

export function useLinkUrlResolver() {
  const urlResolver = useContext(LinkUrlResolverContext);

  if (urlResolver === null) {
    throw new Error(
      "Link must be rendered inside a LinkUrlResolverContext.Provider.",
    );
  }

  return urlResolver;
}

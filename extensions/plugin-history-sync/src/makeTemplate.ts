import UrlPattern from "url-pattern";
import type { ActivityRoute } from "./ActivityRoute";

export function pathToUrl(path: string) {
  return new URL(path, "file://");
}

export function urlSearchParamsToMap(urlSearchParams: URLSearchParams) {
  const map: { [key: string]: any } = {};

  urlSearchParams.forEach((value, key) => {
    map[key] = value;
  });

  return map;
}

function appendTrailingSlashInPathname(pathname: string) {
  if (pathname.endsWith("/")) {
    return pathname;
  }
  return `${pathname}/`;
}

function prependQuestionMarkInSearchParams(searchParams: URLSearchParams) {
  const searchParamsStr = searchParams.toString();

  if (searchParamsStr.length > 0) {
    return `?${searchParams}`;
  }
  return searchParams;
}

/**
 * import { UrlPatternOptions } from "url-pattern"
 */
export interface UrlPatternOptions {
  escapeChar?: string;
  segmentNameStartChar?: string;
  segmentValueCharset?: string;
  segmentNameCharset?: string;
  optionalSegmentStartChar?: string;
  optionalSegmentEndChar?: string;
  wildcardChar?: string;
}

export function makeTemplate<T>(
  route: { activityName: string } & Partial<ActivityRoute<T>>,
  urlPatternOptions?: UrlPatternOptions,
) {
  const path =
    route.path ?? `/.activities/${encodeURIComponent(route.activityName)}`;
  const pattern = new UrlPattern(`${path}(/)`, urlPatternOptions);

  const onlyAsterisk = path === "*" || path === "/*";

  const variableCount = onlyAsterisk
    ? Number.POSITIVE_INFINITY
    : (pattern as any).names.length;

  return {
    fill(params: { [key: string]: string | undefined }) {
      const pathname = pattern.stringify(params);
      const pathParams = pattern.match(pathname);

      const searchParamsMap = { ...params };

      Object.keys(pathParams).forEach((key) => {
        delete searchParamsMap[key];
      });

      const searchParams = new URLSearchParams(
        Object.entries(searchParamsMap).reduce(
          (acc, [key, value]) => ({
            ...acc,
            ...(value
              ? {
                  [key]: value,
                }
              : null),
          }),
          {} as Record<string, string>,
        ),
      );

      return (
        appendTrailingSlashInPathname(pathname) +
        prependQuestionMarkInSearchParams(searchParams)
      );
    },
    parse<T extends { [key: string]: string | undefined }>(
      path: string,
    ): T | null {
      const url = pathToUrl(path);
      const pathParams = pattern.match(url.pathname);
      const searchParams = urlSearchParamsToMap(url.searchParams);

      if (!pathParams) {
        return null;
      }

      const params = {
        ...searchParams,
        ...pathParams,
      };

      return route.decode ? route.decode(params) : params;
    },
    variableCount,
  };
}

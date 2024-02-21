import UriTemplate from "uri-templates";

import type { makeTemplate } from "./makeTemplate";
import type { Route } from "./RouteLike";

function pathToUrl(path: string) {
  return new URL(path, "file://");
}

function urlSearchParamsToMap(urlSearchParams: URLSearchParams) {
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

function compactMap(obj: { [key: string]: string | undefined }) {
  return Object.entries(obj).reduce<any>((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {});
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

export function makeTemplateV2<T>({
  path,
  decode,
}: Route<T>): ReturnType<typeof makeTemplate> {
  const template = UriTemplate(path);

  return {
    fill(params: { [key: string]: string | undefined }) {
      const pathname = template.fillFromObject(compactMap(params));

      const pathParams = template.fromUri(pathname) ?? {};

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

      if (url.pathname.endsWith("/")) {
        url.pathname = url.pathname.slice(0, -1);
      }

      const pathParams = template.fromUri(url.pathname);

      const searchParams = urlSearchParamsToMap(url.searchParams);

      if (!pathParams) {
        return null;
      }

      const params: any = {
        ...searchParams,
        ...pathParams,
      };

      return decode ? decode(params) : params;
    },
    variableCount: template.varNames.length,
  };
}

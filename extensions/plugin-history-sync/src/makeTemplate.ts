import UrlPattern from "url-pattern";

import type { Route } from "./RouteLike";

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
  { path, decode, encode }: Route<T>,
  urlPatternOptions?: UrlPatternOptions,
) {
  const pattern = new UrlPattern(`${path}(/)`, urlPatternOptions);

  const onlyAsterisk = path === "*" || path === "/*";

  const variableCount = onlyAsterisk
    ? Number.POSITIVE_INFINITY
    : (pattern as any).names.length;

  /**
   * Build a URL from already-encoded (string-shaped) params.
   *
   * Shared internal helper used by both {@link fill} (encode-aware path) and
   * {@link fillWithoutEncode} (encode-free path). Centralizing URL-building
   * here prevents the two public methods from drifting apart (see FEP-1061
   * pre-mortem: Scenario 3).
   */
  const _buildUrl = (encodedParams: { [key: string]: string | undefined }) => {
    const pathname = pattern.stringify(encodedParams);
    const pathParams = pattern.match(pathname);

    const searchParamsMap = { ...encodedParams };

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
  };

  return {
    /**
     * Build a URL from typed params, running `encode` (if provided) first.
     *
     * This is the original fill behavior: `encode` is always called with the
     * component-facing typed params `U`. Callers must pass the original typed
     * params — NEVER already-stringified store values (use
     * {@link fillWithoutEncode} for those).
     */
    fill(params: { [key: string]: any }) {
      const encodedParams: { [key: string]: string | undefined } = encode
        ? encode(params as Parameters<typeof encode>[0])
        : params;
      return _buildUrl(encodedParams);
    },
    /**
     * Build a URL from pre-stringified params, skipping `encode`.
     *
     * Use this when the caller has already stringified the params (e.g. when
     * reading `activity.params` from the core store, which FEP-1061 now
     * guarantees is `{ [key: string]: string | undefined }`). Calling
     * {@link fill} instead would re-run `encode` on already-stringified
     * values and violate the `encode` contract.
     */
    fillWithoutEncode(params: Record<string, string | undefined>) {
      return _buildUrl(params);
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

      return decode ? decode(params) : params;
    },
    variableCount,
  };
}

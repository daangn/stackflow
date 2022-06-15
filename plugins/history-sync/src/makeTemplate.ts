import UrlPattern from "url-pattern";

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

export function makeTemplate(templateStr: string) {
  const pattern = new UrlPattern(`${templateStr}(/)`);

  return {
    fill(params: { [key: string]: string | undefined }) {
      const pathname = pattern.stringify(params);
      const pathParams = pattern.match(pathname) ?? {};

      const searchParamsMap = { ...params };

      Object.keys(pathParams).forEach((key) => {
        delete searchParamsMap[key];
      });

      const searchParams = new URLSearchParams(searchParamsMap as any);

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

      return {
        ...searchParams,
        ...pathParams,
      };
    },
  };
}

// from react-router

import { pathToRegexp, TokensToRegexpOptions, ParseOptions, Key } from 'path-to-regexp'

import { PageRouteProps } from '../components/PageRoute'

const cache = {}
const cacheLimit = 10000
let cacheCount = 0

function compilePath(
  path: string,
  options: TokensToRegexpOptions & ParseOptions = {}
): {
  regexp: RegExp
  keys: Key[]
} {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {})

  if (pathCache[path]) return pathCache[path]

  const keys: Key[] = []
  const regexp = pathToRegexp(path, keys, options)
  const result = { regexp, keys }

  if (cacheCount < cacheLimit) {
    pathCache[path] = result
    cacheCount++
  }

  return result
}

/**
 * Public API for matching a URL pathname to a path.
 */
export function matchPath(pathname: string, options: Partial<PageRouteProps> = {}) {
  const { path, exact = false } = options

  const paths: string[] = path ? (typeof path === 'object' ? path : [path]) : []

  return paths.reduce((matched, path) => {
    if (!path && path !== '') return null
    if (matched) return matched

    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict: false,
      sensitive: false,
    })
    const match = regexp.exec(pathname)

    if (!match) return null

    const [url, ...values] = match
    const isExact = pathname === url

    if (exact && !isExact) return null

    return {
      path, // the path used to match
      url: path === '/' && url === '' ? '/' : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo, key, index) => {
        memo[key.name] = values[index]
        return memo
      }, {}),
    }
  }, null)
}

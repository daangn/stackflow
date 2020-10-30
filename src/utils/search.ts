import qs from 'querystring'

export function appendSearch(
  search: string | null,
  dict: {
    [key: string]: string | undefined
  }
) {
  const parsedSearch = search ? qs.parse(search) : null

  return qs.stringify({
    ...parsedSearch,
    ...dict,
  })
}

import qs from 'qs'

export function appendSearch(
  search: string | null,
  dict: {
    [key: string]: string
  }
) {
  const parsedSearch = search ? qs.parse(search) : null

  return qs.stringify({
    ...parsedSearch,
    ...dict,
  })
}

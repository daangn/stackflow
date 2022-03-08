interface Route {
  name: string
  path: string
  description: string
  queryParams: Record<string, string>
}

export { Route }

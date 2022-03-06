const parsePathParams = (path: string) =>
  path
    .substring(1)
    .split('/')
    .reduce(
      (acc, curr) => {
        if (curr.startsWith(':')) {
          const parameterKey = curr.substring(1)
          acc.params = `${acc.params} ${parameterKey},`.trim()
          acc.paramsType = `${acc.paramsType}
                ${parameterKey}: string;
                `.trim()
        }
        return acc
      },
      { params: '', paramsType: '' }
    )

export default parsePathParams

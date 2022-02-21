import fs from 'fs'
import path from 'path'

import { compile } from 'json-schema-to-typescript'

const generate = async (options: string[]) => {
  const outputIndex = options.indexOf('--output')
  const generatePath =
    outputIndex === -1 ? '__generated__' : options[outputIndex + 1]
  const targetSchema = options.find((option) => option.includes('.json'))

  const cwd = process.cwd()
  const generatedDirectory = path.resolve(cwd, generatePath)

  if (!fs.existsSync(generatedDirectory)) {
    fs.mkdirSync(generatedDirectory)
  }

  const jsonFile = fs.readFileSync(path.resolve(`/${targetSchema}`), 'utf-8')
  const jsonData = JSON.parse(jsonFile)

  const result = await createSdk(jsonData)

  fs.writeFileSync(
    path.join(generatedDirectory, `${jsonData.name}Sdk.ts`),
    result,
    'utf-8'
  )
}

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

const capitalizeFirstLetter = (text: string) =>
  `${text.charAt(0).toUpperCase()}${text.slice(1)}`

interface Route {
  name: string
  path: string
  description: string
  queryParams: Record<string, string>
}

const createSdk = async (metaData: {
  routes: Route[]
  name: string
  endpoint: string
  endpoints: Record<string, string>
  version: number
}) => {
  const { routes, name, endpoint, endpoints, version } = metaData

  const hasEndpoints = endpoints && Object.keys(endpoints).length > 0
  const sdkName = capitalizeFirstLetter(name)
  const types: string[] = []

  const routeMethods: string[] = await Promise.all(
    routes.map(async (route: Route) => {
      const methodName = `open${sdkName}${capitalizeFirstLetter(route.name)}`
      const { paramsType } = parsePathParams(route.path)

      const paramType = await compile(
        route.queryParams,
        `${capitalizeFirstLetter(methodName)}QueryParamsType`,
        {
          bannerComment: '',
        }
      )
      types.push(paramType)

      return `
  /**
   * ${route.description}
   */
  ${methodName}(params : {${paramsType}}, queryParams?: ${capitalizeFirstLetter(
        methodName
      )}QueryParamsType) {
    const dynamicPath = getDynamicPath('${route.path}', params);
    const hasQueryParams = queryParams && Object.keys(queryParams).length > 0;
    
    ${
      hasEndpoints
        ? `const endpoints = ${JSON.stringify(endpoints)}`
        : `const endpoint = "${endpoint}"`
    }
    if(hasQueryParams) {
      const dynamicPathWithQueryString = dynamicPath + "?" + new URLSearchParams(queryParams as Record<string, string>).toString() 
      onOpen(${
        hasEndpoints ? 'endpoints' : 'endpoint'
      }, dynamicPathWithQueryString);
      return;
    }
    onOpen(${hasEndpoints ? 'endpoints' : 'endpoint'}, dynamicPath);
  },`.trim()
    })
  )

  const routeMethodsWithTypes = routeMethods
    .reduce((acc: string, curr: string) => {
      return `${acc}
        
        ${curr}`
    }, '')
    .trim()

  return `
${types
  .reduce((acc: string, curr: string) => {
    return `${acc}
        
        ${curr}`
  }, '')
  .trim()}
  
const getDynamicPath = (path: string, params: Record<string, string> = {}) => path
        .split('/')
        .map((item) => 
          item.startsWith(':') ? params[item.substring(1)] : item
        )
        .join('/')
        
export const make${sdkName}Sdk = ({ onOpen = (${
    hasEndpoints ? 'endpoints: Record<string, string>' : 'endpoint : string'
  }, path: string) => {
  window.location.href = ${
    hasEndpoints
      ? 'Object.keys(endpoints)[Object.keys(endpoints).length-1] + path'
      : 'endpoint + path'
  };
}}: {onOpen : (${
    hasEndpoints ? 'endpoints: Record<string, string>' : 'endpoint : string'
  }, path: string) => void;}) => ({
   ${routeMethodsWithTypes}
   getVersion() {
       return ${version};
   }
})
   `.trim()
}

export default generate

# @karrotframe/pathfinder

sdk generator tool for routes by schema

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [CLI Options](#cli-option)
- [Entire Schema Definition](#entire-schema-definition)
- [Route Schema Definition](#route-schema-definition)
- [Entire Schema Example](#entire-schema-example)
- [generated SDK](#generated-sdk)
- [Redefine onOpen callback for usage](#redefine-onopen-callback-for-usage)

## Installation

```shell
$ yarn add @karrotframe/pathfinder
```

## Usage

```shell
$ yarn generate example.json
```

```shell
$ yarn generate ./schema/example.json # relative path
```

## CLI Option

- `output` : Specify directory path to generate sdk file ( default: `__generated__` )

```shell
$ yarn generate example.json --output ./sdk
```

## Entire Schema Definition

| name          | type   | description                                                                                                    | example                          |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `name`        | String | Sdk name to generate                                                                                           | `"example"`                      |
| `description` | String | Description for sdk                                                                                            | `"sdk for example route"`        |
| `author`      | String | Author who is responsible for schema                                                                           | `"John Doe"`                     |
| `endpoint`    | String | Declare domain URL                                                                                             | `"https://example.com"`          |
| `endpoints`   | Object | Key is environment and value is domain URL.<br/> If `endpoint` is also declared, `endpoint` should be ignored. | `{ prod: "https://example.com"}` |
| `version`     | Number | Version for Sdk                                                                                                | `1`                              |
| `routes`      | Array  | Array contains `Route` elements.                                                                               |                                  |

## `Route` Schema Definition

| name          | type        | description                                                                                                                                                                                                                                                        | example                               |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `name`        | String      | name for route page                                                                                                                                                                                                                                                | `"guitar"`                            |
| `description` | String      | description for route method                                                                                                                                                                                                                                       | `"Method to open guitar detail page"` |
| `path`        | String      | URI for route page.<br/> If you declare param like `:exampleId`, this param will be parsed into first parameter of method<br/> i.e. : `item/:id/comments/:subId` -> `foo({ id, subId })`                                                                           | `"/product/guitar/:guitarId"`         |
| `queryParams` | JSON Schema | queryParams will be parsed second parameter of method and properties should be usable as query string. <br/> Although you do not need `queryParams`, you should declare it with <br/>`{ "additionalProperties": false }` <br/> currently. It should be fixed soon. | please, see below                     |

### `queryParams` example

```json
{
  "type": "object",
  "properties": {
    "referrer": {
      "type": "string",
      "description": "tracking referrer page",
      "enum": ["guitar"]
    }
  },
  "required": ["referrer"],
  "additionalProperties": false
}
```

## Entire Schema Example

```json
{
  "name": "example",
  "description": "sdk for example route",
  "author": "John Doe",
  "endpoint": "https://example.com",
  "endpoints": {
    "prod": "https://example.prod.com"
  },
  "version": 1,
  "routes": [
    {
      "name": "guitar",
      "path": "/product/guitar/:guitarId",
      "description": "Method to open guitar detail page",
      "queryParams": {
        "additionalProperties": false
      }
    },
    {
      "name": "accessory",
      "path": "/product/accessory/:accessoryId",
      "description": "Method to open accessory detail page",
      "queryParams": {
        "type": "object",
        "properties": {
          "referrer": {
            "type": "string",
            "description": "tracking referrer page",
            "enum": ["guitar"]
          }
        },
        "required": ["referrer"],
        "additionalProperties": false
      }
    }
  ]
}
```

## generated SDK

```typescript
export interface OpenExampleGuitarQueryParamsType {}
export interface OpenExampleAccessoryQueryParamsType {
  /**
   * tracking referrer page
   */
  referrer: 'guitar'
}

const getDynamicPath = (path: string, params: Record<string, string> = {}) =>
  path
    .split('/')
    .map((item) => (item.startsWith(':') ? params[item.substring(1)] : item))
    .join('/')

export const makeExampleSdk = ({
  onOpen = (endpoints: Record<string, string>, path: string) => {
    window.location.href =
      Object.keys(endpoints)[Object.keys(endpoints).length - 1] + path
  },
}: {
  onOpen: (endpoints: Record<string, string>, path: string) => void
}) => ({
  /**
   * Method to open guitar detail page
   */
  openExampleGuitar(
    params: { guitarId: string },
    queryParams?: OpenExampleGuitarQueryParamsType
  ) {
    const dynamicPath = getDynamicPath('/product/guitar/:guitarId', params)
    const hasQueryParams = queryParams && Object.keys(queryParams).length > 0

    const endpoints = { prod: 'https://example.prod.com' }
    if (hasQueryParams) {
      const dynamicPathWithQueryString =
        dynamicPath +
        '?' +
        new URLSearchParams(queryParams as Record<string, string>).toString()
      onOpen(endpoints, dynamicPathWithQueryString)
      return
    }
    onOpen(endpoints, dynamicPath)
  },

  /**
   * Method to open accessory detail page
   */
  openExampleAccessory(
    params: { accessoryId: string },
    queryParams?: OpenExampleAccessoryQueryParamsType
  ) {
    const dynamicPath = getDynamicPath(
      '/product/accessory/:accessoryId',
      params
    )
    const hasQueryParams = queryParams && Object.keys(queryParams).length > 0

    const endpoints = { prod: 'https://example.prod.com' }
    if (hasQueryParams) {
      const dynamicPathWithQueryString =
        dynamicPath +
        '?' +
        new URLSearchParams(queryParams as Record<string, string>).toString()
      onOpen(endpoints, dynamicPathWithQueryString)
      return
    }
    onOpen(endpoints, dynamicPath)
  },
  getVersion() {
    return 1
  },
})
```

## Redefine `onOpen` callback for usage

To customize methods of SDK, you should redefine `onOpen` callback.

```typescript
import customRoute from 'customRoute'
import { makeExampleSdk } from '__generated__'

const { openExampleGuitar } = makeExampleSdk({
  onOpen: (endpoint: string, path: string) => {
    const targetPath = endpoint + path
    customRoute.push(targetPath)
  },
})

const handler = () => {
  const params = { guitarId: '12' }
  openExampleGuitar(params)
}
```

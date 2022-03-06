# @karrotframe/pathfinder

sdk generator tool for routes by schema

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [CLI Options](#cli-option)
- [Entire Schema Definition](#entire-schema-definition)
- [Route Schema Definition](#route-schema-definition)
- [Entire Schema Example](#entire-schema-example)
- [Redefine onOpen callback for usage](#redefine-onopen-callback-for-usage)

## Installation

```shell
$ yarn add @karrotframe/pathfinder
```

## Usage

```shell
$ yarn pathfinder init # create initial files
$ yarn pathfinder generate -s schema.json # generate sdk file from schema
```

## CLI Option

- `-s, --source` : load json file defining schema

```shell
$ yarn pathfinder generate --source schema.json # load local json file
```

```shell
$ yarn pathfinder generate --source https://example.com/example.json # load remote json file
```

---

- `-o, --output` : Specify directory path to generate sdk file ( default: `__generated__` )

```shell
$ yarn pathfinder generate example.json --output ./sdk
```

### `.pathfinderrc` config file

A config file could be used instead of CLI option.
Note that option of config file would be ignored when any same option have been declared from CLI option and from config file both.

- `source` : path for json schema file.
- `output` : path for generated sdk.

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

## Redefine `onOpen` callback for usage

To customize methods of SDK, you should redefine `onOpen` callback.

```typescript
import customRoute from 'customRoute'
import { makeExampleSdk } from '__generated__'

const { openRouteJobs } = makeExampleSdk({
  onOpen: (endpoint: string, path: string) => {
    const targetPath = endpoint + path
    this.bridge.router.push(targetPath)
  },
})

const handler = () => {
  const params = { newguitarId: 'constant' }
  openExampleGuitar(params)
}
```

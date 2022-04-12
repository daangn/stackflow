# @karrotframe/pathfinder

<div align="center">

![](https://img.shields.io/npm/v/@karrotframe/pathfinder)
![](https://img.shields.io/npm/l/@karrotframe/pathfinder)
![](https://img.shields.io/npm/dt/@karrotframe/pathfinder)

</div>

**code generator tool for routes by schema**

- ✈️ handle routes with schema
- 🛠 enable to switch generator function

This repository is inspired by @daangn/generate-routes(private repository) of [juyeong1260](https://github.com/juyeong1260)

- [한국어](./README.ko.md)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [CLI Options](#cli-option)
- [Entire Schema Definition](#entire-schema-definition)
- [Route Schema Definition](#route-schema-definition)
- [Entire Schema Example](#entire-schema-example)
- [Redefine onOpen callback for usage](#redefine-onopen-callback-for-usage)
- [Register Schema](#register-schema)

## Installation

```shell
$ yarn add @karrotframe/pathfinder
```

## Usage

```shell
$ yarn pathfinder init # create initial files
$ yarn pathfinder generate -s schema.json # generate code file from schema
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

- `-o, --output` : Specify directory path to generate result file ( default: `__generated__` )

```shell
$ yarn pathfinder generate -s schema.json  --output ./result
```

---

- `-r, --replace` : Replace generator function with specific module from npm package

```shell
$ yarn pathfinder generate -s schema.json -r custom-generator-name
```

---

- `-u, --suffix` : name to describe result type. First letter will be capitalized automatically ( default: `Sdk` )

```shell
$ yarn pathfinder generate -s schema.json -u result
```

---

- `-d, --debug` : Turn on debug mode to display all messages

```shell
$ yarn pathfinder generate -d
```

---

### `.pathfinderrc` config file

A config file could be used instead of CLI option.
Note that option of config file would be ignored when any same option have been declared from CLI option and from config file both.

- `source` : path for json schema file.
- `output` : path for generated result.
- `replace` : custom generator function with specific module from npm package to replace a basic built-in function.
- `suffix` : name to describe result type.
- `repository` : path for a repository to preserve schemas. It is explained at bottom section with more detail.

## Entire Schema Definition

| name          | type   | description                                                                                                    | example                          |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `name`        | String | name to generate                                                                                               | `"example"`                      |
| `description` | String | Description for schema                                                                                         | `"sdk for example route"`        |
| `author`      | String | Author who is responsible for schema                                                                           | `"John Doe"`                     |
| `endpoint`    | String | Declare domain URL                                                                                             | `"https://example.com"`          |
| `endpoints`   | Object | Key is environment and value is domain URL.<br/> If `endpoint` is also declared, `endpoint` should be ignored. | `{ prod: "https://example.com"}` |
| `version`     | Number | Version for generated result                                                                                   | `1`                              |
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

To customize methods, you should redefine `onOpen` callback.

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

## Register Schema

> ❗ experimental ❗

You could register schema files to your custom repository with `register` command like below:

```shell
$ yarn pathfinder register https://example.com/schema -y https://schema-repository.com/example
```

You could use `-y` or `--repository` option on CLI to indicate an endpoint of schema repository,

or you could declare `repository` field in the config file.

But you should prepare a back-end system to preserve schemas with the repository.

`register` command is just a POST request as http method for any concise usage.

Therefore, you could use other commands like `CURL` instead, if you are already expert for that.

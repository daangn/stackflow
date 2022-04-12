# @karrotframe/pathfinder

<div align="center">

![](https://img.shields.io/npm/v/@karrotframe/pathfinder)
![](https://img.shields.io/npm/l/@karrotframe/pathfinder)
![](https://img.shields.io/npm/dt/@karrotframe/pathfinder)

</div>

**라우트 스키마를 이용한 code generator 도구**

- ✈️ 스키마라는 진실의 원천으로 라우트를 다루어요
- 🛠 독자적인 custom generator 함수를 사용할 수 있어요

이 프로젝트는 [juyeong1260](https://github.com/juyeong1260) 의 @daangn/generate-routes(private repository) 에서 아이디어를 얻었어요.

## 목차

- [Installation](#installation)
- [Usage](#usage)
- [CLI Options](#cli-option)
- [Entire Schema Definition](#entire-schema-definition)
- [Route Schema Definition](#route-schema-definition)
- [Entire Schema Example](#entire-schema-example)
- [Redefine onOpen callback for usage](#redefine-onopen-callback-for-usage)

## 설치

```shell
$ yarn add @karrotframe/pathfinder
```

## 사용법

```shell
$ yarn pathfinder init # code generate 에 필요한 파일을 생성해요
$ yarn pathfinder generate -s schema.json # 스키마로부터 code 파일을 generate 해요
```

## CLI Option

- `-s, --source` : 스키마를 정의한 파일을 읽어요

```shell
$ yarn pathfinder generate --source schema.json # 로컬 저장소에 존재하는 json 파일을 읽어요
```

```shell
$ yarn pathfinder generate --source https://example.com/example.json # 리모트 저장소에 존재하는 json 파일을 읽어요
```

---

- `-o, --output` : generate 결과로 나올 파일을 저장할 디렉터리 경로를 설정해요. ( 기본값 : `__generated__` )

```shell
$ yarn pathfinder generate -s schema.json  --output ./result
```

---

- `-r, --replace` : 기본으로 제공하는 generator 함수를 npm package 로 설치한 특정 모듈로 교체해요

```shell
$ yarn pathfinder generate -s schema.json -r custom-generator-name
```

---

- `-u, --suffix` : generate 결과물의 성격이 무엇인지 이름을 붙이기 위해 접미어를 설정해요. 처음 철자는 자동으로 대문자로 치환해요. ( 기본값: `Sdk` )

```shell
$ yarn pathfinder generate -s schema.json -u result
```

---

- `-d, --debug` : 모든 메시지를 출력하는 디버그 모드를 작동시켜요

```shell
$ yarn pathfinder generate -d
```

---

### `.pathfinderrc` 설정 파일

CLI 옵션을 사용하는 대신 설정 파일을 사용할 수 있어요.
만약 CLI 옵션과 설정 파일을 동시에 사용하는 경우, CLI 옵션을 우선하기 때문에 설정 파일 내용은 반영하지 않아요.

- `source` : json schema 파일을 읽어오기 위한 경로에요.
- `output` : generate 결과물을 저장하는 경로를 설정해요.
- `replace` : 기본으로 사용하는 generator 함수 대신 독자적인 custom generator 함수를 사용하기 위해 npm package 의 특정 모듈 이름을 선언해요.
- `suffix` : generate 결과물의 성격이 무엇인지 이름을 붙이기 위해 접미어를 설정해요.
- `repository` : (실험적 기능) 스키마들을 저장하기 위한 저장소 경로를 명시해요. 현재 문서의 최하단에 더 자세히 설명하고 있어요.

## 스키마 정의

| name          | type   | description                                                                              | example                                      |
| ------------- | ------ | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| `name`        | String | generate 하는 스키마의 이름이에요                                                        | `"example"`                                  |
| `description` | String | 스키마를 설명해요. 스키마의 도메인이 무엇인지 목적인지 무엇인지 등을 설명할 수 있어요.   | `"라우트 정보를 예시로 표현하는 스키마에요"` |
| `author`      | String | 스키마의 변동 사항을 책임지는 책임자의 이름을 작성해요.                                  | `"John Doe"`                                 |
| `endpoint`    | String | 라우트 스키마가 작동하는 origin 도메인을 명시해요.                                       | `"https://example.com"`                      |
| `endpoints`   | Object | 라우트 스키마가 작동하는 origin 도메인을 key 와 함께 명시해요. `endpoint` 보다 우선해요. | `{ prod: "https://example.com"}`             |
| `version`     | Number | 스키마의 버전을 명시해요                                                                 | `1`                                          |
| `routes`      | Array  | `Route` 정보를 담고 있는 배열이에요.                                                     |                                              |

## `Route` Schema Definition

| name          | type        | description                                                                                                                                                                                                     | example                                |
| ------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `name`        | String      | 라우트 페이지의 이름이에요. 함수 시그니처 생성 때 이 이름을 사용해요.                                                                                                                                           | `"guitar"`                             |
| `description` | String      | generate 결과로 나올 라우트 메서드를 설명해요.                                                                                                                                                                  | `"세부 제품 페이지로 이동하는 라우트"` |
| `path`        | String      | route page 를 설명하는 URI 에요.<br/> `:exampleId` 와 같은 형태로 params 을 명시했다면, generate 결과로 나오는 메서드의 첫번째 인자에 포함시켜요<br/> 예시 : `item/:id/comments/:subId` -> `foo({ id, subId })` | `"/product/guitar/:guitarId"`          |
| `queryParams` | JSON Schema | generate 결과로 나오는 메서드의 두번째 인자에 포함시켜요. queryParams 의 필드는 query string 으로 사용해요                                                                                                      | 아래에 좀 더 자세히 설명했어요         |

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

## 스키마 실제 예시

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

## 각 사용에 맞게 `onOpen` 콜백을 재정의하기

generate 한 메서드를 각 상황에 맞게 사용할 수 있도록 `onOpen` 콜백을 재정의해요. onOpen 콜백을 사용하여 특정 router 모듈과의 결합도를 낮출 수 있어요.

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

## 스키마 등록하기 (실험적 기능)

다음과 같이 `register` 명령어를 사용해서 독자적인 저장소에 스키마 파일들을 등록할 수 있어요.

```shell
$ yarn pathfinder register https://example.com/schema -y https://schema-repository.com/example
```

CLI 옵션으로 `-y` 나 `--repository` 를 사용해서 스키마 저장소의 엔드포인트를 지정할 수 있어요.

아니면, 설정 파일에서 `repository` 필드를 선언해서 엔드포인트를 지정하는 것도 가능해요.

현재는 이 기능을 사용하기 위해 스키마를 저장하기 위한 별도의 저장소와 리모트 서버 환경을 구축해야 해요.

`register` 명령어는 단순히 http 메서드인 POST 요청을 간결하게 사용하기 위한 수단일 뿐이에요.

따라서, 익숙하다면 `curl` 명령어 등을 대신 사용해도 괜찮아요.

# PR 6a: 문서 코드 예제 수정

> 선행 PR: PR 3, PR 4 (API 승격 완료 후)
> PR #695 ENvironmentSet 리뷰 반영 (FEP-2129)

## 목적

PR #695에서 ENvironmentSet이 지적한 문서 코드 예제 오류를 수정한다. (삭제/rename은 PR 6b로, structured-activity 문서 개선은 PR 6c로 분리.)

## 작업

### 1. `stackflow()` 반환값에서 `useFlow` destructuring 제거

실제 `StackflowOutput` 타입 (`integrations/react/src/stackflow.tsx:46-50`):

```ts
export type StackflowOutput = {
  Stack: StackComponentType;
  actions: Actions;
  stepActions: StepActions<ActivityBaseParams>;
};
```

`useFlow`는 반환값에 포함되지 않으며, `@stackflow/react`에서 독립 훅으로 직접 import해야 한다.

**수정 파일:**

| 파일 | 라인 |
|------|------|
| `docs/pages/docs/get-started/installation.en.mdx` | L40, L70 |
| `docs/pages/docs/get-started/installation.ko.mdx` | L40, L71 |
| `docs/pages/docs/get-started/activity.en.mdx` | L81 |
| `docs/pages/docs/get-started/activity.ko.mdx` | L84 |
| `docs/pages/docs/advanced/history-sync.en.mdx` | L43 |
| `docs/pages/docs/advanced/history-sync.ko.mdx` | L43 |
| `docs/pages/docs/migration-v2.en.mdx` | L52 ("After") |
| `docs/pages/docs/migration-v2.ko.mdx` | L52 ("변경 후") |

**수정 방향:**
```diff
- const { Stack, useFlow } = stackflow(...)
+ const { Stack } = stackflow(...)
+ import { useFlow } from "@stackflow/react";
```

### 2. `ActivityComponentType` v1 → v2 타입 패턴 변경

v2 `ActivityComponentType`은 params 객체 타입 대신 activity 이름 string literal을 받는다. 기존 params 객체 방식은 `ActivityComponentTypeByParams`로 rename.

**수정 파일:**
- `docs/pages/docs/get-started/navigating-activities.en.mdx` L141-145
- `docs/pages/docs/get-started/navigating-activities.ko.mdx` L143-147

**수정 방향:**
```diff
- type ArticleParams = { title: string; };
- const Article: ActivityComponentType<ArticleParams> = ({ params }) => {
+ declare module "@stackflow/config" {
+   interface Register {
+     Article: { title: string };
+   }
+ }
+ const Article: ActivityComponentType<"Article"> = ({ params }) => {
```

### 3. `ActivityLoaderArgs` import 경로 오류

`ActivityLoaderArgs`는 `@stackflow/config`에서만 export된다 (`config/src/index.ts:4`). `@stackflow/react`에서는 내부 사용만 하며 re-export하지 않는다.

**수정 파일:**

| 파일 | 라인 |
|------|------|
| `docs/pages/docs/advanced/loader-api.en.mdx` | L6 |
| `docs/pages/docs/advanced/loader-api.ko.mdx` | L6 |
| `docs/pages/docs/advanced/preloading.en.mdx` | L12 |
| `docs/pages/docs/advanced/preloading.ko.mdx` | L12 |

> `loader-api.{en,ko}.mdx`는 PR 6b에서 삭제 예정. PR 6b와 머지 시점 조율 필요.

**수정 방향:**
```diff
- import { ActivityLoaderArgs, useLoaderData } from "@stackflow/react";
+ import type { ActivityLoaderArgs } from "@stackflow/config";
+ import { useLoaderData } from "@stackflow/react";
```

### 4. `@stackflow/link` API 레퍼런스 수정

#### 4-a. `animate` 기본값 설명 오류

현재 문서 (`link.en.mdx:45`, `link.ko.mdx:45`):
> "If not provided, it defaults to no animation."

실제 동작 (`extensions/link/src/Link.tsx:89-99`): `animate`를 생략하면 빈 옵션 `{}`가 전달되어 push/replace의 기본 동작(**애니메이션 ON**)이 적용된다. 설명을 "기본 애니메이션 적용"으로 수정.

#### 4-b. 존재하지 않는 `urlPatternOptions` prop 제거

실제 `LinkProps` (`Link.tsx:24-31`):
```ts
export interface LinkProps<K extends RegisteredActivityName> extends AnchorProps {
  ref?: React.RefObject<HTMLAnchorElement>;
  activityName: K;
  activityParams: InferActivityParams<K>;
  animate?: boolean;
  replace?: boolean;
}
```

`urlPatternOptions`는 `config.historySync`에서 내부적으로 사용될 뿐 사용자 prop이 아니다.

**수정 파일:**
- `docs/pages/api-references/plugins/link.en.mdx` L47 — prop 문서 제거
- `docs/pages/api-references/plugins/link.ko.mdx` L47 — prop 문서 제거

#### 4-c. Link ref 타입 오류

문서에는 `React.ForwardedRef<HTMLAnchorElement>`로 기재되어 있으나 실제는 `React.RefObject<HTMLAnchorElement>`.

**수정 파일:**
- `docs/pages/api-references/plugins/link.en.mdx` L48
- `docs/pages/api-references/plugins/link.ko.mdx` L48

### 5. `plugin-history-sync` 문서 v2 업데이트

현재 v1 API 패턴을 그대로 사용 중:
- `const { Stack, useFlow } = stackflow({ activities: { ... } })`
- `routes` 옵션 (v2에서는 config에 선언)

v2 config-first 패턴으로 전면 업데이트.

**수정 파일:**
- `docs/pages/api-references/plugins/plugin-history-sync.en.mdx`
- `docs/pages/api-references/plugins/plugin-history-sync.ko.mdx`

### 6. `migration-v2` 문서 개선

#### 6-a. 5단계 "Before" 예시 확장

현재:
```ts
import { useFlow } from "./stackflow";
```

`./stackflow`라는 파일 경로가 묵시적이어서 이해가 어렵다. `stackflow()` 팩토리에서 `useFlow`를 destructuring하여 export하는 **전체 맥락**을 보여주도록 확장.

#### 6-b. API 대응표에서 `./stackflow` → `stackflow()` 팩토리 표현으로 변경

현재:
```
| `useFlow()` from `./stackflow` | `useFlow()` from `@stackflow/react` |
```

파일 경로 대신 `stackflow()` 팩토리라는 표현으로 수정.

**수정 파일:**
- `docs/pages/docs/migration-v2.en.mdx`
- `docs/pages/docs/migration-v2.ko.mdx`

### 7. `write-plugin` 문서 수정

#### 7-a. 오타

`write-plugin.ko.mdx:262`: `G현재 스택의 상태를 가져올 수 있어요` → `현재 스택의 상태를 가져올 수 있어요`

#### 7-b. 존재하지 않는 lifecycle hook 이름 수정

`initialPushedEvent`는 존재하지 않는 훅. 올바른 이름은 `overrideInitialEvents`.

**수정 파일:**
- `docs/pages/docs/advanced/write-plugin.en.mdx` L261, L272
- `docs/pages/docs/advanced/write-plugin.ko.mdx` L269, L280

## 확인 사항

- [ ] 수정된 모든 파일에서 `useFlow`가 `@stackflow/react`에서 직접 import
- [ ] `stackflow()` destructuring에 `useFlow` 미포함
- [ ] `ActivityComponentType<ParamsObject>` → `ActivityComponentType<"ActivityName">`
- [ ] `ActivityLoaderArgs` import 경로가 `@stackflow/config`로 수정
- [ ] `animate` 기본값 설명 정정
- [ ] `urlPatternOptions` prop 문서 제거
- [ ] Link ref 타입 `React.RefObject`로 수정
- [ ] `plugin-history-sync` 문서 v2 패턴
- [ ] `migration-v2` Before 예시/대응표 수정
- [ ] `write-plugin` 오타/lifecycle hook 이름 수정
- [ ] EN/KO 양쪽 동기화
- [ ] 문서 사이트 로컬 빌드 정상

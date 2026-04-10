# Future API → Stable 승격 및 기존 API 제거 계획

## 개요

Stackflow의 "Future API" (`@stackflow/react/future`)를 Stable(기본 API)로 승격하고, 기존 Stable API(`@stackflow/react/stable`)를 제거하는 파괴적 변경(breaking change) 계획.

이 변경은 Stackflow 2.0 릴리스의 핵심이며, Config 기반 접근법, Loader API, 구조화된 Activity 컴포넌트 등의 개선사항을 기본 API로 만든다.

---

## 1. 변경 대상 패키지

### 1.1 `@stackflow/react` (핵심 변경)

**현재 상태:**
- `"."` → `dist/index.ts` → `export * from "./stable"` (stable이 기본)
- `"./stable"` → `dist/stable/index.ts` (기존 API)
- `"./future"` → `dist/future/index.ts` (새 API)

**변경 계획:**
- `"."` → future 코드를 기본 진입점으로 변경
- `"./stable"` → 삭제
- `"./future"` → 삭제 (기본이 되므로 불필요)

**삭제 대상 소스:**
- `integrations/react/src/stable/` 디렉토리 전체
  - `stackflow.tsx` (기존 factory 함수)
  - `useActions.ts`
  - `useStepActions.ts`
  - 기타 stable 전용 파일들

**`index.ts` 변경:**
```typescript
// Before
export * from "./stable";

// After
export * from "./future";
```

**기존 Stable에만 있는 export (제거됨):**
- `useActions` → `useFlow`로 대체
- `useStepActions` → `useStepFlow`로 대체

**Future에만 있는 export (새로 기본 제공):**
- `lazy` - 코드 스플리팅용 lazy 로딩
- `useLoaderData` - Loader 데이터 접근
- `useConfig` - Config 접근
- `usePrepare` - 프리페칭
- `useActivityPreparation` - Activity 프리페칭 이펙트
- `useFlow` - 타입 안전한 액션 (기존 `useActions` 대체)
- `useStepFlow` - 타입 안전한 Step 액션 (기존 `useStepActions` 대체)
- `structuredActivityComponent` / `StructuredActivityComponentType` - 구조화된 Activity
- `Actions`, `StepActions` 타입
- `StackComponentType` 타입
- `StaticActivityComponentType` 타입

**`stackflow()` 함수 시그니처 변경:**
```typescript
// Before (stable)
stackflow({
  activities: { MyActivity: Component },
  transitionDuration: 350,
  plugins: [...],
})

// After (future → 새 기본)
stackflow({
  config: defineConfig({ ... }),
  components: { MyActivity: Component },
  plugins: [...],
})
```

**반환값 변경:**
```typescript
// Before
{ Stack, useFlow, activities, addActivity, addPlugin, actions }

// After
{ Stack, actions, stepActions }
// useFlow, useStepFlow는 직접 import
```

### 1.2 `@stackflow/link` (동일 패턴)

**현재 상태:**
- `"."` → `export * from "./stable"` (stable이 기본)
- `"./stable"` → `createLinkComponent`, `Link`
- `"./future"` → `Link` (직접 import)

**변경 계획:**
- `"."` → future의 `Link`를 기본으로
- `"./stable"` → 삭제
- `"./future"` → 삭제
- `createLinkComponent` → 제거 (factory 패턴 불필요)

**삭제 대상 소스:**
- `extensions/link/src/stable/` 디렉토리 전체
- `extensions/link/src/future/` 디렉토리 → 내용을 `src/`로 이동

### 1.3 `@stackflow/compat-await-push` (패키지 삭제)

**현재 상태:** Old API의 `await push()` 패턴을 지원하는 호환 레이어
**변경 계획:** 패키지 전체 삭제 (deprecated)

**삭제 대상:**
- `extensions/compat-await-push/` 디렉토리 전체
- 워크스페이스 설정에서 제거

### 1.4 `@stackflow/plugin-preload` (패키지 삭제)

**현재 상태:** stable/future 공용. `createPreloader`, `useLoaders`, `pluginPreload` 등 export
**변경 계획:** Future API에 `usePrepare`가 내장되어 있으므로 패키지 전체 삭제

**삭제 대상:**
- `extensions/plugin-preload/` 디렉토리 전체
- 워크스페이스 설정에서 제거
- `@stackflow/link`의 peerDependency에서 제거

### 1.5 `@stackflow/plugin-map-initial-activity` (패키지 삭제)

**현재 상태:** Stable API 전용. `mapInitialActivityPlugin` export
**변경 계획:** Future API에서는 `config.initialActivity`로 대체. 패키지 전체 삭제

**삭제 대상:**
- `extensions/plugin-map-initial-activity/` 디렉토리 전체
- 워크스페이스 설정에서 제거

### 1.6 `@stackflow/react` — `__internal__` 제거

**현재 상태:** `integrations/react/src/__internal__/` 디렉토리에 stable/future 양쪽에서 공유하던 내부 유틸리티 코드 존재
**변경 계획:** `__internal__` 디렉토리 제거. 필요한 코드는 future(새 기본) 소스에 직접 통합

**삭제 대상:**
- `integrations/react/src/__internal__/` 디렉토리 전체
- 해당 코드를 참조하는 import 경로 수정

### 1.7 `@stackflow/config` (변경 없음)

이미 Future API의 핵심 패키지이므로 변경 불필요. Stable 승격 후에도 동일하게 유지.

### 1.8 `@stackflow/core` (변경 없음)

양쪽 API에서 공통으로 사용. 변경 불필요.

### 1.9 `@stackflow/plugin-history-sync` (변경 없음)

이미 Future API와 호환. Config 기반 라우트 정의를 지원.

### 1.10 기타 플러그인 (변경 없음 예상)

다음 플러그인들은 Plugin 인터페이스를 통해 동작하므로 변경 불필요:
- `plugin-basic-ui`
- `plugin-renderer-basic`
- `plugin-renderer-web`
- `plugin-devtools`
- `plugin-google-analytics-4`
- `plugin-sentry`
- `plugin-blocker`
- `plugin-stack-depth-change`
- `react-ui-core`

---

## 2. 파괴적 API 변경 요약

### 2.1 Import 경로 변경

| Before | After |
|--------|-------|
| `@stackflow/react` | `@stackflow/react` (내용 변경) |
| `@stackflow/react/stable` | 삭제 |
| `@stackflow/react/future` | 삭제 (`@stackflow/react`로 통합) |
| `@stackflow/link` | `@stackflow/link` (내용 변경) |
| `@stackflow/link/stable` | 삭제 |
| `@stackflow/link/future` | 삭제 (`@stackflow/link`로 통합) |
| `@stackflow/compat-await-push` | 삭제 |
| `@stackflow/plugin-preload` | 삭제 (`usePrepare`로 대체) |
| `@stackflow/plugin-map-initial-activity` | 삭제 (`config.initialActivity`로 대체) |

### 2.2 API 변경

| Before (Stable) | After (New Default) |
|-----------------|---------------------|
| `stackflow({ activities, transitionDuration })` | `stackflow({ config, components })` |
| `const { useFlow } = stackflow(...)` | `import { useFlow } from "@stackflow/react"` |
| `useActions()` | `useFlow()` |
| `useStepActions(name)` | `useStepFlow()` |
| `stepPush()` | `pushStep()` |
| `stepReplace()` | `replaceStep()` |
| `stepPop()` | `popStep()` |
| `createLinkComponent(...)` | `import { Link } from "@stackflow/link"` |
| `React.lazy(() => import(...))` | `lazy(() => import(...))` from `@stackflow/react` |

### 2.3 타입 시스템 변경

```typescript
// Before: 컴포넌트 Props에서 타입 추론
const MyActivity = (props: { params: { id: string } }) => ...;

// After: Config에서 모듈 선언으로 타입 정의
declare module "@stackflow/config" {
  interface Register {
    MyActivity: { id: string };
  }
}
```

---

## 3. 문서 변경 계획

### 3.1 삭제 대상

- `docs/pages/api-references/future-api/` 디렉토리
  - `introduction.{en,ko}.mdx` → 삭제 (더 이상 "미리보기"가 아님)
  - `changes.{en,ko}.mdx` → 마이그레이션 가이드로 이동
  - `_meta.{en,ko}.json` → 삭제

### 3.2 이동/통합 대상

- **Loader API** (`loader-api.{en,ko}.mdx`) → `docs/pages/docs/` 하위로 이동 (핵심 기능)
- **Code Splitting** (`code-splitting.{en,ko}.mdx`) → `docs/pages/docs/advanced/`로 이동
- **API Pipelining** (`api-pipelining.{en,ko}.mdx`) → `docs/pages/docs/advanced/`로 이동
- **Config** (`config.{en,ko}.mdx`) → `docs/pages/api-references/`로 이동 또는 get-started에 통합

### 3.3 수정 대상

- `docs/pages/docs/get-started/` - 전체 재작성
  - **installation** - `@stackflow/config` 필수 의존성으로 추가
  - **activity** - `defineConfig()` + `stackflow({ config, components })` 패턴으로 변경
  - **navigating-activities** - `useFlow()` 직접 import 패턴으로 변경
  - **navigating-step** - `useStepFlow()` + `pushStep/replaceStep/popStep` 명명으로 변경
  - **getting-state** - `useConfig()`, `useLoaderData()` 등 새 훅 추가

- `docs/pages/docs/advanced/`
  - **history-sync** - Config 기반 라우트 설정으로 변경
  - **preloading** - `usePrepare()` 기반으로 변경
  - **write-plugin** - 필요시 업데이트

- `docs/pages/api-references/plugins/`
  - **link** - `createLinkComponent` 제거, 직접 import으로 변경
  - **plugin-preload** - 문서 삭제
  - **plugin-map-initial-activity** - 문서 삭제

### 3.4 신규 문서

- **마이그레이션 가이드** (`docs/pages/docs/migration-v2.{en,ko}.mdx`)
  - v1 → v2 마이그레이션 단계별 안내
  - API 대응표
  - `changes.{en,ko}.mdx` 내용 통합 및 확장

### 3.5 네비게이션 구조 변경

```json
// docs/pages/api-references/_meta.en.json
// Before
{ "future-api": "Future API", "plugins": "Plugins" }

// After
{ "plugins": "Plugins" }
// 또는 config 문서를 여기로 이동
{ "config": "@stackflow/config", "plugins": "Plugins" }
```

---

## 4. 소스 코드 작업 순서

### Phase 1: 내부 코드 정리

1. `integrations/react/src/__internal__/` 코드 중 future에서 사용하는 부분을 future 소스에 통합
2. `integrations/react/src/__internal__/` 삭제
3. `integrations/react/src/future/` 코드를 `integrations/react/src/`로 이동
4. `integrations/react/src/stable/` 삭제
5. `integrations/react/src/index.ts` 변경
6. `extensions/link/src/future/` 코드를 `extensions/link/src/`로 이동
7. `extensions/link/src/stable/` 삭제

### Phase 2: package.json 정리

8. `@stackflow/react` - `./stable`, `./future` export 경로 삭제
9. `@stackflow/link` - `./stable`, `./future` export 경로 삭제

### Phase 3: 패키지 삭제

10. `@stackflow/compat-await-push` - 패키지 삭제, 워크스페이스에서 제거
11. `@stackflow/plugin-preload` - 패키지 삭제, 워크스페이스에서 제거
12. `@stackflow/plugin-map-initial-activity` - 패키지 삭제, 워크스페이스에서 제거

### Phase 4: 데모 앱 업데이트

13. `demo/` - import 경로에서 `/future` 제거
14. `demo/` - `compat-await-push`, `plugin-preload`, `plugin-map-initial-activity` 의존성 제거

### Phase 5: 문서 업데이트

13. Future API 문서를 메인 문서로 통합
14. Get Started / Advanced 문서 재작성
15. 마이그레이션 가이드 작성
16. 네비게이션 구조 업데이트

### Phase 6: 빌드 설정 정리

17. `esbuild.config.js` - stable/future 분리 빌드 제거
18. `tsconfig.json` - 관련 경로 설정 정리

### Phase 7: 버전 및 릴리스

19. Changeset 생성 (major bump)
20. CHANGELOG 업데이트
21. npm deprecate 실행 (`@stackflow/compat-await-push`, `@stackflow/plugin-preload`, `@stackflow/plugin-map-initial-activity`)

---

## 5. 영향받는 파일 목록

### 삭제
```
integrations/react/src/stable/            # 디렉토리 전체
integrations/react/src/future/            # 코드 이동 후 삭제
integrations/react/src/__internal__/      # 디렉토리 전체 (필요한 코드는 통합 후)
extensions/link/src/stable/               # 디렉토리 전체
extensions/link/src/future/               # 코드 이동 후 삭제
extensions/compat-await-push/             # 패키지 전체
extensions/plugin-preload/                # 패키지 전체
extensions/plugin-map-initial-activity/   # 패키지 전체
docs/pages/api-references/future-api/     # 문서 이동 후 삭제
```

### 수정
```
integrations/react/src/index.ts           # export 변경
integrations/react/package.json           # exports 필드 정리
extensions/link/src/index.ts              # export 변경
extensions/link/package.json              # exports 필드 정리
demo/src/                                 # import 경로 업데이트
docs/pages/docs/get-started/*.mdx         # 전체 재작성
docs/pages/docs/advanced/*.mdx            # 업데이트
docs/pages/api-references/_meta.*.json    # 네비게이션 변경
docs/pages/api-references/plugins/*.mdx   # 일부 업데이트
```

### 신규
```
docs/pages/docs/migration-v2.en.mdx       # 마이그레이션 가이드
docs/pages/docs/migration-v2.ko.mdx       # 마이그레이션 가이드 (한국어)
```

---

## 6. 리스크 및 고려사항

- **Major 버전 범프** 필수 (v2.0.0) — 모든 `@stackflow/*` 패키지에 대해
- **하위 호환성 없음** — stable API를 사용하는 모든 사용자가 마이그레이션 필요
- **`@stackflow/config` 필수 의존성화** — 기존에는 Future API 사용자만 필요했으나 이제 필수
- **모듈 선언 패턴 강제** — `declare module "@stackflow/config"` 패턴이 표준이 됨
- **`__internal__` 코드 제거** — stable/future 양쪽에서 공유하던 내부 유틸리티를 제거하고 필요한 부분만 future 소스에 직접 통합
- **삭제 패키지 3개** — `compat-await-push`, `plugin-preload`, `plugin-map-initial-activity` 삭제 후 npm deprecate 실행

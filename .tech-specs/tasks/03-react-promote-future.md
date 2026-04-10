# PR 3: `@stackflow/react` — Future를 기본 API로 승격

> 선행 PR: PR 2 (`__internal__` 제거)

## 목적

`@stackflow/react/future`를 `@stackflow/react`의 기본 진입점으로 만들고, stable API와 future 하위 경로를 제거한다.

## 작업

### 1. 소스 코드 구조 변경

- `integrations/react/src/future/` 내용을 `integrations/react/src/`로 이동
- `integrations/react/src/stable/` 디렉토리 전체 삭제
- `integrations/react/src/future/` 디렉토리 삭제 (이동 완료 후)

### 2. `index.ts` 변경

```typescript
// Before
export * from "./stable";

// After — future 코드가 src/ 루트로 이동했으므로 직접 export
// (future/index.ts의 내용을 그대로 가져옴)
```

### 3. `package.json` exports 정리

```jsonc
// Before
{
  "exports": {
    ".": { ... },
    "./stable": { ... },
    "./future": { ... }
  }
}

// After
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.mjs"
    }
  }
}
```

### 4. 빌드 설정 정리

- `esbuild.config.js` — stable/future 분리 빌드 엔트리포인트 제거
- `tsconfig.json` — 필요시 경로 설정 정리

### 5. 삭제되는 export

- `useActions` (→ `useFlow`로 대체)
- `useStepActions` (→ `useStepFlow`로 대체)

### 6. 새로 기본 제공되는 export

- `lazy`, `useLoaderData`, `useConfig`, `usePrepare`, `useActivityPreparation`
- `useFlow`, `useStepFlow`
- `structuredActivityComponent`, `StructuredActivityComponentType`
- `Actions`, `StepActions`, `StackComponentType`, `StaticActivityComponentType`

## 확인 사항

- [ ] `yarn typecheck` 통과
- [ ] `yarn build` 통과
- [ ] `yarn test` 통과
- [ ] `import { stackflow } from "@stackflow/react"` 가 future의 stackflow를 가리킴
- [ ] `@stackflow/react/stable` import 시 에러
- [ ] `@stackflow/react/future` import 시 에러

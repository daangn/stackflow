# PR 4: `@stackflow/link` — Future를 기본 API로 승격

> 선행 PR: PR 3 (`@stackflow/react` 승격 완료 필요 — future Link가 react/future의 훅을 사용)

## 목적

`@stackflow/link/future`를 `@stackflow/link`의 기본 진입점으로 만들고, stable API와 future 하위 경로를 제거한다.

## 작업

### 1. 소스 코드 구조 변경

- `extensions/link/src/future/` 내용을 `extensions/link/src/`로 이동
- `extensions/link/src/stable/` 디렉토리 전체 삭제
- `extensions/link/src/future/` 디렉토리 삭제 (이동 완료 후)

### 2. `index.ts` 변경

```typescript
// Before
export * from "./stable";

// After — future 코드가 src/ 루트로 이동
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

### 4. peerDependencies 정리

- `@stackflow/plugin-preload` peerDependency 제거 (PR 1에서 패키지 삭제됨)
- `@stackflow/react` import 경로에서 `/future` 제거 (PR 3 이후 기본이므로)

### 5. 삭제되는 export

- `createLinkComponent` (factory 패턴 제거)

### 6. 빌드 설정 정리

- `esbuild.config.js` — stable/future 분리 빌드 엔트리포인트 제거

## 확인 사항

- [ ] `yarn typecheck` 통과
- [ ] `yarn build` 통과
- [ ] `import { Link } from "@stackflow/link"` 가 future의 Link를 가리킴
- [ ] `@stackflow/link/stable` import 시 에러
- [ ] `@stackflow/link/future` import 시 에러

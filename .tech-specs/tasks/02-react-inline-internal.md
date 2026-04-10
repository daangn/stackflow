# PR 2: `@stackflow/react` — `__internal__` 제거

> 선행 PR: 없음 (PR 1과 병렬 가능)

## 목적

`integrations/react/src/__internal__/` 디렉토리를 제거한다. future 소스에서 사용하는 코드는 future 디렉토리로 직접 이동하고, stable에서만 사용하는 코드는 그대로 둔다 (PR 3에서 stable 전체 삭제 시 함께 제거).

## 작업

### 1. 의존성 분석

- `__internal__/`에서 export하는 모든 심볼 목록 작성
- 각 심볼이 `stable/`, `future/` 중 어디서 import되는지 확인
- future에서 사용하는 심볼만 future 소스에 통합

### 2. 코드 이동

- `__internal__/`에서 future가 사용하는 파일들을 `future/` 디렉토리로 이동
- `future/` 내부의 import 경로를 상대 경로에서 로컬 경로로 수정
- `stable/`의 `__internal__` import도 상대 경로로 임시 수정 (PR 3에서 삭제 예정)

### 3. `__internal__/` 삭제

- 디렉토리 전체 삭제
- 남아있는 import 참조가 없는지 확인

## 주요 파일 (예상)

```
integrations/react/src/__internal__/
├── StructuredActivityComponentType.tsx
├── ActivityComponentType.ts
├── MonolithicActivityComponentType.ts
└── (기타 유틸리티)
```

## 확인 사항

- [ ] `yarn typecheck` 통과
- [ ] `yarn build` 통과
- [ ] `yarn test` 통과
- [ ] `__internal__` 문자열이 `integrations/react/src/` 어디에도 없음

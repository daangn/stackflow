# PR 1: deprecated 패키지 삭제

> 선행 PR: 없음

## 목적

Stable API에서만 사용되거나 Future API에 내장된 기능으로 대체된 패키지 3개를 삭제한다.

## 삭제 대상

### 1. `@stackflow/compat-await-push`

- **경로:** `extensions/compat-await-push/`
- **이유:** Old API의 `await push()` 패턴 호환 레이어. Future API에서는 사용하지 않음
- **작업:**
  - `extensions/compat-await-push/` 디렉토리 전체 삭제
  - 루트 `package.json` 워크스페이스 설정에서 제거 (해당하는 경우)
  - 다른 패키지의 dependency/peerDependency에서 참조 제거

### 2. `@stackflow/plugin-preload`

- **경로:** `extensions/plugin-preload/`
- **이유:** Future API의 `usePrepare()` 훅으로 대체
- **작업:**
  - `extensions/plugin-preload/` 디렉토리 전체 삭제
  - `@stackflow/link`의 `peerDependencies`에서 `@stackflow/plugin-preload` 제거
  - 다른 패키지의 dependency/peerDependency에서 참조 제거
  - 플러그인 문서 삭제: `docs/pages/api-references/plugins/plugin-preload.{en,ko}.mdx`
  - `docs/pages/api-references/plugins/_meta.{en,ko}.json`에서 항목 제거

### 3. `@stackflow/plugin-map-initial-activity`

- **경로:** `extensions/plugin-map-initial-activity/`
- **이유:** Future API의 `config.initialActivity`로 대체
- **작업:**
  - `extensions/plugin-map-initial-activity/` 디렉토리 전체 삭제
  - 다른 패키지의 dependency/peerDependency에서 참조 제거
  - 플러그인 문서 삭제: `docs/pages/api-references/plugins/plugin-map-initial-activity.{en,ko}.mdx`
  - `docs/pages/api-references/plugins/_meta.{en,ko}.json`에서 항목 제거

## 확인 사항

- [ ] `yarn install` 후 워크스페이스 에러 없음
- [ ] `yarn typecheck` 통과
- [ ] `yarn build` 통과
- [ ] `demo/`에서 삭제된 패키지 import가 없는지 확인 (있으면 제거)

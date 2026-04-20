# PR 8: `@stackflow/compat-await-push` 복구

> 선행 PR: 없음 (가능한 한 빨리 진행)
> PR #695 ENvironmentSet 리뷰 반영 (FEP-2125)

## 목적

ENvironmentSet의 반대로 `@stackflow/compat-await-push` 삭제 계획을 철회하고, v2 릴리스에서도 해당 패키지를 유지한다.

## 배경

ENvironmentSet의 반대 사유:

1. **대체 API 부재** — `receive(push(...))` 패턴(다른 Activity에서 데이터를 돌려받는 패턴)을 대체하는 API가 v2에 없음
2. **v2 호환성 문제 없음** — Stackflow 내부 API를 import하지 않는 순수 유틸리티(`resolveMap` 기반 Promise 패턴)이므로 v1/v2 독립적으로 동작
3. **활발한 사용** — 조직 내 9개 활성 프로젝트가 의존 중

## 작업

### 1. 디렉토리 복구

`extensions/compat-await-push/`가 이미 삭제된 경우 git history에서 복구:

```bash
# 삭제된 커밋 이전 버전에서 복구
git checkout <pre-deletion-sha> -- extensions/compat-await-push/
```

복구 후 확인:
- `package.json` — v2 워크스페이스 설정과 일관된 버전
- peer dependency 범위가 v2와 호환되는지 확인 (필요 시 `^2.0.0` 허용)

### 2. 워크스페이스 등록 확인

- 루트 `package.json` workspaces에 `extensions/compat-await-push` 포함
- `yarn install` 후 빌드 가능 여부 확인

### 3. `extensions/link/README.md` 업데이트 (관련 작업)

> ENvironmentSet 지적: `extensions/link/README.md` L7, L9-10, L20에서 삭제된 `@stackflow/plugin-preload`를 여전히 의존성으로 안내 중.

- `@stackflow/plugin-preload` 관련 설명 제거
- v2 사용법(=`usePrepare()` 등)으로 업데이트

### 4. 관련 PR 수정

- `01-delete-deprecated-packages.md`에서 `compat-await-push` 제외 (이미 반영됨)
- `07a-fix-changesets.md`에서 "Removed packages" 항목 제거 (이미 반영됨)
- 기존 PR #695의 "npm deprecate" 섹션에서 `@stackflow/compat-await-push` 제거

### 5. v2 호환성 검증

- `@stackflow/compat-await-push`가 v2 `@stackflow/react`/`@stackflow/core`와 함께 작동하는지 확인
- peer dependency 업데이트만으로 v2 호환이 되는지, 소스 수정이 필요한지 판단
- 필요 시 patch/minor bump로 changeset 추가

## 확인 사항

- [ ] `extensions/compat-await-push/` 디렉토리 복구됨
- [ ] `yarn install` + `yarn build` 정상 통과
- [ ] `yarn typecheck` 통과
- [ ] v2 패키지와 함께 사용 시 런타임 정상 동작 확인
- [ ] `extensions/link/README.md`에서 `plugin-preload` 의존성 안내 제거됨
- [ ] `01-delete-deprecated-packages.md`, `07a-fix-changesets.md`, PR #695 본문에서 일관되게 반영됨
- [ ] 필요 시 v2 peer dep 업데이트 changeset 추가

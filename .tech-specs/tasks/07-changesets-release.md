# PR 7: Changeset 생성 및 릴리스 준비

> 선행 PR: PR 1~6 모두 머지 완료 후

## 목적

모든 파괴적 변경에 대한 Changeset을 생성하고, v2.0.0 릴리스를 준비한다.

## 작업

### 1. Changeset 생성

Major bump 대상 패키지:
- `@stackflow/react` — API 전면 변경
- `@stackflow/link` — API 전면 변경
- `@stackflow/core` — 메이저 버전 동기화 (변경 없지만 2.0 생태계 통일)
- `@stackflow/config` — 메이저 버전 동기화

### 2. npm deprecate 대상

릴리스 후 실행:
```bash
npm deprecate @stackflow/compat-await-push "Removed in Stackflow 2.0. Use event-based patterns instead."
npm deprecate @stackflow/plugin-preload "Removed in Stackflow 2.0. Use usePrepare() from @stackflow/react instead."
npm deprecate @stackflow/plugin-map-initial-activity "Removed in Stackflow 2.0. Use config.initialActivity instead."
```

### 3. CHANGELOG 주요 항목

- **BREAKING:** `@stackflow/react` — `stackflow()` 시그니처 변경 (`{ activities }` → `{ config, components }`)
- **BREAKING:** `@stackflow/react` — `useActions`, `useStepActions` 제거 → `useFlow`, `useStepFlow` 사용
- **BREAKING:** `@stackflow/react` — `./stable`, `./future` 하위 경로 제거
- **BREAKING:** `@stackflow/link` — `createLinkComponent` 제거, `Link` 직접 import
- **BREAKING:** `@stackflow/link` — `./stable`, `./future` 하위 경로 제거
- **REMOVED:** `@stackflow/compat-await-push` 패키지 삭제
- **REMOVED:** `@stackflow/plugin-preload` 패키지 삭제
- **REMOVED:** `@stackflow/plugin-map-initial-activity` 패키지 삭제
- **NEW:** `useLoaderData`, `useConfig`, `usePrepare`, `lazy`, `structuredActivityComponent` 기본 제공

## 확인 사항

- [ ] `yarn changeset` 정상 실행
- [ ] 모든 breaking change가 changeset에 기록됨
- [ ] `yarn release` dry-run 정상

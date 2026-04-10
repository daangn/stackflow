# PR 6: 문서 업데이트

> 선행 PR: PR 3, PR 4 (API 승격 완료 후)

## 목적

Future API 문서를 메인 문서로 통합하고, 기존 문서를 새 API에 맞게 재작성한다.

## 작업

### 1. Future API 문서 디렉토리 정리

**삭제:**
- `docs/pages/api-references/future-api/introduction.{en,ko}.mdx` — 더 이상 "미리보기"가 아님
- `docs/pages/api-references/future-api/_meta.{en,ko}.json`

**이동:**
- `future-api/loader-api.{en,ko}.mdx` → `docs/pages/docs/get-started/` 또는 `docs/pages/docs/advanced/`
- `future-api/code-splitting.{en,ko}.mdx` → `docs/pages/docs/advanced/`
- `future-api/api-pipelining.{en,ko}.mdx` → `docs/pages/docs/advanced/`
- `future-api/api-pipelining-diagram-1.png` → 함께 이동
- `future-api/config.{en,ko}.mdx` → `docs/pages/api-references/` 또는 get-started에 통합
- `future-api/changes.{en,ko}.mdx` → 마이그레이션 가이드 작성 시 참고 자료로 활용

**최종 삭제:**
- `docs/pages/api-references/future-api/` 디렉토리 전체

### 2. 네비게이션 구조 변경

**`docs/pages/api-references/_meta.{en,ko}.json`:**
- `"future-api"` 항목 제거
- 필요시 `"config"` 항목 추가

**`docs/pages/docs/advanced/_meta.{en,ko}.json`:**
- `"code-splitting"`, `"api-pipelining"` 항목 추가

**`docs/pages/docs/get-started/_meta.{en,ko}.json`:**
- `"loader-api"` 항목 추가 (또는 advanced에 배치)

### 3. Get Started 문서 재작성

| 문서 | 변경 내용 |
|------|----------|
| `installation` | `@stackflow/config` 필수 의존성 추가, `defineConfig()` 소개 |
| `activity` | `defineConfig()` + `stackflow({ config, components })` 패턴으로 변경 |
| `navigating-activities` | `import { useFlow } from "@stackflow/react"` 직접 import 패턴 |
| `navigating-step` | `useStepFlow()` + `pushStep/replaceStep/popStep` 명명 |
| `getting-state` | `useConfig()`, `useLoaderData()` 등 새 훅 추가 |

### 4. Advanced 문서 업데이트

| 문서 | 변경 내용 |
|------|----------|
| `history-sync` | Config 기반 라우트 설정으로 변경 (route를 config에 선언) |
| `preloading` | `usePrepare()` 기반으로 전면 재작성, plugin-preload 언급 제거 |
| `write-plugin` | 필요시 업데이트 |

### 5. 플러그인 문서 정리

**삭제** (PR 1에서 미처리 시):
- `docs/pages/api-references/plugins/plugin-preload.{en,ko}.mdx`
- `docs/pages/api-references/plugins/plugin-map-initial-activity.{en,ko}.mdx`
- `_meta.{en,ko}.json`에서 해당 항목 제거

**수정:**
- `plugins/link.{en,ko}.mdx` — `createLinkComponent` 제거, 직접 `import { Link }` 패턴으로 변경

### 6. 마이그레이션 가이드 작성

**신규 파일:**
- `docs/pages/docs/migration-v2.en.mdx`
- `docs/pages/docs/migration-v2.ko.mdx`

**내용:**
- v1 → v2 마이그레이션 단계별 안내
- API 대응표 (Before/After)
- `changes.{en,ko}.mdx` 내용 통합 및 확장
- 삭제된 패키지 대체 방법
- 타입 시스템 변경 (컴포넌트 Props → Config Register)

### 7. 문서 내 "Future API" 언급 일괄 제거

모든 문서에서:
- "Future API" → 그냥 API (또는 제거)
- "@stackflow/react/future" → "@stackflow/react"
- "@stackflow/link/future" → "@stackflow/link"
- "Stackflow 2.0 미리보기" 등 프리뷰 관련 문구 제거

## 확인 사항

- [ ] 문서 사이트 로컬 빌드 정상
- [ ] 깨진 링크 없음
- [ ] EN/KO 양쪽 동기화
- [ ] "future" 또는 "/future" 문자열이 문서에 남아있지 않음

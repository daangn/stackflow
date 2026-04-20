# PR 6b: 문서 구조 변경 (삭제/rename/네비게이션)

> 선행 PR: PR 3, PR 4
> PR #695 ENvironmentSet 리뷰 반영 (FEP-2129 추가 리뷰)

## 목적

ENvironmentSet이 지적한 중복/불필요 문서를 정리하고, 네비게이션 라벨을 수정한다.

## 작업

### 1. `resolving-circular-reference` 문서 삭제

v2에서는 `useFlow`를 `@stackflow/react`에서 직접 import하므로 순환참조 문제가 발생하지 않는다. 또한 문서에서 참조하는 `useActions`는 v2에 존재하지 않는 API이다.

**삭제:**
- `docs/pages/docs/advanced/resolving-circular-reference.en.mdx`
- `docs/pages/docs/advanced/resolving-circular-reference.ko.mdx`

**반영:**
- `docs/pages/docs/advanced/_meta.en.json`에서 항목 제거
- `docs/pages/docs/advanced/_meta.ko.json`에서 항목 제거

### 2. `loader-api` 문서 삭제 + `preloading`을 "Loader API"로 rename

`loader-api`와 `preloading` 문서 내용이 중복된다. `loader-api` 삭제 후 `preloading`의 제목을 "Loader API"로 변경한다.

**삭제:**
- `docs/pages/docs/advanced/loader-api.en.mdx`
- `docs/pages/docs/advanced/loader-api.ko.mdx`

**변경:**
- `docs/pages/docs/advanced/preloading.en.mdx` — 제목 → "Loader API"
- `docs/pages/docs/advanced/preloading.ko.mdx` — 제목 → "Loader API"

**반영:**
- `docs/pages/docs/advanced/_meta.en.json` — `loader-api` 제거, `preloading` 라벨 → "Loader API"
- `docs/pages/docs/advanced/_meta.ko.json` — 동일

> 파일명(`preloading.mdx`)까지 변경할지, 라우팅 리다이렉트가 필요한지는 PR에서 별도 결정.

### 3. `@stackflow/config` 네비게이션 이름 변경 (ko)

**수정 파일:**
- `docs/pages/api-references/_meta.ko.json`

**변경:**
```diff
- "@stackflow/config": "@stackflow/config"
+ "@stackflow/config": "설정"
```

## 확인 사항

- [ ] `resolving-circular-reference` 파일 2개 삭제 + meta 반영
- [ ] `loader-api` 파일 2개 삭제 + meta 반영
- [ ] `preloading` 제목 "Loader API"로 변경 (meta에도 반영)
- [ ] `@stackflow/config` 한국어 라벨 "설정"
- [ ] 삭제된 문서를 링크하는 다른 문서 없는지 확인 (있으면 링크 수정)
- [ ] 문서 사이트 로컬 빌드 정상 (404 없음)

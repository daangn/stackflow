# PR 6c: structured-activity 문서 개선

> 선행 PR: PR 3
> PR #695 ENvironmentSet 리뷰 반영 (FEP-2129 추가 리뷰)

## 목적

`structured-activity` 관련 문서의 예시와 line highlighting을 소스 실제 구조에 맞게 개선한다.

## 작업

### 1. `content` 예시 단순화

`content` 컴포넌트가 `useActivityParams`를 쓰는 대신 매개변수로 `params`를 직접 받도록 예시 변경. (복잡한 훅 사용보다 props 패턴이 이해에 용이)

### 2. API 섹션 제거

추후 전체 API를 다루는 별도 페이지가 만들어질 예정. 현재 문서의 API 섹션은 제거.

### 3. Line highlighting 수정 (한/영 모두)

현재 하이라이트 라인이 의미 없는 위치(빈 줄, 닫는 괄호)를 가리키고 있음. 실제 의미 있는 줄을 가리키도록 수정.

| 섹션 | 현재 | 수정 | 이유 |
|------|------|------|------|
| Loading State (`Article.tsx`) | `{3,7}` | `{2,6}` | import와 `loading:` 줄 |
| Layout (`Article.tsx`) | `{3,4,8,9}` | `{2,7}` | import와 `layout:` 줄 |
| With Loader API (`stackflow.config.ts`) | `{8}` | `{2,9}` | `import articleLoader`와 `loader:` 줄 |

**수정 파일:**
- `docs/pages/docs/advanced/structured-activity.en.mdx`
- `docs/pages/docs/advanced/structured-activity.ko.mdx`

## 확인 사항

- [ ] `content` 예시가 매개변수로 `params`를 받는 패턴으로 단순화
- [ ] API 섹션 제거
- [ ] 3개 섹션의 line highlighting이 실제 의미 있는 줄을 가리킴
- [ ] EN/KO 양쪽 동기화

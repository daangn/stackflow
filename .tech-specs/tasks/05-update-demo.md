# PR 5: 데모 앱 업데이트

> 선행 PR: PR 1 (패키지 삭제), PR 3 (react 승격), PR 4 (link 승격)

## 목적

데모 앱의 import 경로와 의존성을 새 API 구조에 맞게 업데이트한다.

## 작업

### 1. import 경로 변경

모든 소스 파일에서:

```typescript
// Before
import { ... } from "@stackflow/react/future";
import { Link } from "@stackflow/link/future";

// After
import { ... } from "@stackflow/react";
import { Link } from "@stackflow/link";
```

### 2. 삭제된 패키지 의존성 제거

`demo/package.json`에서 제거:
- `@stackflow/compat-await-push`
- `@stackflow/plugin-preload`
- `@stackflow/plugin-map-initial-activity`

해당 패키지를 import/사용하는 코드도 제거.

### 3. 플러그인 설정 정리

`demo/src/`의 stackflow 설정에서:
- `pluginPreload()` 사용 제거 → `usePrepare()` 사용 확인
- `mapInitialActivityPlugin()` 사용 제거 → `config.initialActivity` 사용 확인
- `compatAwaitPush` 관련 코드 제거

## 확인 사항

- [ ] `yarn install` 후 에러 없음
- [ ] `yarn typecheck` 통과
- [ ] `yarn build` 통과
- [ ] 데모 앱 로컬 실행 정상 동작
- [ ] `/future` 또는 `/stable` 하위 경로 import가 없음
- [ ] 삭제된 패키지 import가 없음

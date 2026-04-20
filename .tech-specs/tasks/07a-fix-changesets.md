# PR 7a: Changeset 수정 및 누락 Breaking Changes 추가

> 선행 PR: PR 1~6 완료 후
> PR #695 ENvironmentSet 리뷰 반영 (FEP-2130)

## 목적

PR #695에서 ENvironmentSet이 지적한 changeset 오류를 수정하고, 기록되지 않은 breaking changes를 추가한다.

## 작업

### 1. Changeset 파일 분리

현재 `nine-rabbits-jam.md` 하나에 4개 패키지가 묶여 있어, 동일한 본문이 모든 패키지 CHANGELOG에 들어간다.

**분리 방안:**

```
.changeset/
  react-v2-breaking.md        # @stackflow/react: major
  link-v2-breaking.md         # @stackflow/link: major
  ecosystem-major-bump.md     # @stackflow/config: major, @stackflow/core: major
                              # 본문: "Major version bump for ecosystem alignment"
```

### 2. 하위 플러그인 패키지 changeset 추가 + peer dep 업데이트

PR에서 import 변경이 있었으나 changeset이 누락된 패키지:

| 패키지 | 변경 내용 | bump |
|--------|----------|------|
| `plugin-basic-ui` | `@stackflow/react/future` → `@stackflow/react` import 변경 | patch |
| `plugin-blocker` | 동일 | patch |
| `plugin-history-sync` | `useActions` → `useFlow` 변경 | patch |
| `plugin-lifecycle` | 동일 | patch |

위 패키지들의 `package.json` peer dependency 업데이트:

```diff
- "@stackflow/react": "^1.x"
+ "@stackflow/react": "^2.0.0"
```

### 3. `@stackflow/link` bump를 patch로 변경

> 인라인 코멘트: `extensions/link/package.json:48`
> "major bump가 아니라 patch bump 해야겠어요. history-sync-plugin이 stackflow 2.0 대응하기 위해서 peer deps 업데이트한 게 patch라서요."

현재 major bump로 기록되어 있으나, `@stackflow/link`의 변경이 v2 대응 peer deps 업데이트 수준이라면 **patch**가 맞음. `link-v2-breaking.md` changeset bump 레벨을 major → patch로 조정.

> 단, 실제 link 패키지의 변경 범위(API 제거/rename 포함 여부)를 다시 확인 후 결정. Breaking API 변경이 실제로 포함되어 있다면 ENvironmentSet과 재협의 필요.

### 4. `@stackflow/compat-await-push` 삭제 항목 제거

ENvironmentSet 반대로 삭제 계획에서 제외 (별도 PR로 복구, `08-restore-compat-await-push.md` 참조).
changeset 본문의 "Removed packages" 섹션에서 `@stackflow/compat-await-push` 항목 제거.

### 5. 누락된 Breaking Changes 추가

#### `@stackflow/react`

| # | 항목 | 변경 내용 |
|---|------|----------|
| 1 | 훅 제거 | `useActiveEffect`, `useEnterDoneEffect`, `useStep` 기존 stable export에서 제거 |
| 2 | `stackflow()` 반환값 | `activities` 필드 제거 |
| 3 | `stackflow().actions` 축소 | `getStack()`, `dispatchEvent()` 제거 — 새 `Actions` 타입은 `push`, `replace`, `pop`만 노출 |
| 4 | step actions 구조 변경 | `stackflow().actions.stepPush` → `stackflow().stepActions.pushStep` (이름 변경만 언급되어 있고 접근 경로 변경은 미기록) |
| 5 | `useActivityParams` 제네릭 | `useActivityParams<{ key: string }>()` → `useActivityParams<"ActivityName">()` |
| 6 | `ActivityComponentType` 제네릭 | `ActivityComponentType<ParamsObject>` → `ActivityComponentType<"ActivityName">`. 기존 방식은 `ActivityComponentTypeByParams`로 rename |
| 7 | `stackflow()` 입력 타입 | `StackflowOptions<T extends BaseActivities>` (`{ activities, transitionDuration }`) → `StackflowInput<T, R>` (`{ config, components }`) |
| 8 | `stackflow()` 출력 타입 | `StackflowOutput<T>` → `StackflowOutput` — 제네릭 제거, `activities`/`useFlow`/`useStepFlow`/`addActivity`/`addPlugin` 필드 제거, `stepActions` 필드 추가 |

#### `@stackflow/link`

| # | 항목 | 변경 내용 |
|---|------|----------|
| 9 | `LinkProps.urlPatternOptions` prop 제거 |
| 10 | `forwardRef` 미사용 | ref 타입: `React.ForwardedRef<HTMLAnchorElement>` → `React.RefObject<HTMLAnchorElement>` |

## 확인 사항

- [ ] changeset 파일이 패키지별로 분리됨
- [ ] 각 changeset 본문이 해당 패키지 관련 내용만 포함
- [ ] 플러그인 패키지 4개의 changeset 추가됨
- [ ] 플러그인 패키지 4개의 peer dep 범위 업데이트됨
- [ ] `@stackflow/link` bump 레벨 재검토 (major vs patch)
- [ ] `@stackflow/compat-await-push` "Removed" 항목 제거
- [ ] 누락된 breaking changes 10건이 `@stackflow/react`/`@stackflow/link` changeset에 기록
- [ ] `yarn changeset` dry-run 정상

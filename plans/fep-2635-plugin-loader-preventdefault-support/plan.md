# FEP-2635 작업 계획 — Prevented Action을 인지하는 plugin-loader

- 이슈: [FEP-2635](https://linear.app/daangn/issue/FEP-2635)
  — `plugin-loader`가 preventDefault된 push/replace의 loader와 lazy preload를 실행하고
  Stack을 pause함
- 상태: 구현 리뷰 반영 (2026-07-24)

## 목표

사용자 플러그인이 `push` 또는 `replace`를 `preventDefault()`한 경우, 뒤에서 실행되는
React 내장 `plugin-loader`가 해당 action을 관찰만 하고 다음 작업은 전혀 시작하지
않도록 한다.

- Activity loader를 호출하지 않는다.
- lazy Activity component preload를 호출하지 않는다.
- `pause()`/`resume()`을 호출하지 않는다.
- loaderData를 `activityContext`에 주입하지 않는다.
- 원래 `Pushed`/`Replaced` event는 지금과 같이 dispatch하지 않는다.

동시에 `preventDefault()` 이후에도 남은 pre-effect hook은 plugin 순서대로 계속
실행한다. 이번 수정은 hook pipeline을 중단하는 변경이 아니라, 각 hook이 현재 action의
취소 상태를 판별할 수 있게 하는 변경이다.

## 현재 동작의 근거

- `integrations/react/src/stackflow.tsx:79`에서 사용자 플러그인을 먼저 놓고,
  `integrations/react/src/stackflow.tsx:87`에서 내장 `loaderPlugin`을 마지막에
  추가한다.
- `core/src/utils/triggerPreEffectHooks.ts:38`의 action-local `isPrevented`는
  `preventDefault()`가 호출되면 `true`가 되지만, `core/src/utils/triggerPreEffectHooks.ts:41`
  의 plugin 순회는 계속된다.
- `core/src/utils/makeActions.ts:20`과 `core/src/utils/makeActions.ts:34`는 모든
  pre-effect hook이 반환된 뒤에야 취소 상태를 확인하고 push/replace dispatch를
  생략한다.
- `integrations/react/src/loader/loaderPlugin.tsx:224`부터 loader와 lazy preload를
  먼저 실행하고, pending이면 `integrations/react/src/loader/loaderPlugin.tsx:244`에서
  Stack을 pause한다. 이 hook에는 현재 취소 상태를 읽을 방법이 없다.
- `extensions/plugin-blocker/src/blockerPlugin.spec.tsx:1987`의 기존 계약 테스트는
  blocker 뒤의 플러그인도 예방된 push의 `onBeforePush`를 받는다고 명시한다.

## 확정된 해결 계약

1. **Prevented Action의 의미를 유지한다.**
   `preventDefault()`는 기본 domain event dispatch를 취소하지만 pre-effect hook
   pipeline을 중단하지 않는다.
2. **모든 pre-effect hook이 취소 상태를 읽을 수 있다.**
   공통 hook action API에 `actions.isPrevented(): boolean`을 추가한다.
3. **취소 상태는 action-local이며 live하다.**
   같은 hook에서 `preventDefault()`를 호출한 직후에는 `true`를 반환하고, 중첩 action은
   바깥 action과 독립된 상태를 가진다.
4. **loader는 이미 예방된 action에서 즉시 종료한다.**
   대상 Activity 조회, loader 실행, component preload, pause/resume 예약,
   `overrideActionParams()`보다 먼저 판별한다.
5. **후속 hook의 기존 권한은 바꾸지 않는다.**
   Prevented Action을 받은 다른 플러그인은 계속 action을 관찰하거나
   `overrideActionParams()`를 호출할 수 있다. 다만 최종 dispatch는 계속 취소된다.
6. **정상 navigation의 loader 계약은 바꾸지 않는다.**
   예방되지 않은 push/replace의 loader, lazy preload, immediate-render 판정,
   pause/resume, loaderData 전달 방식은 그대로 둔다.
7. **테스트 코드를 추가하거나 수정하지 않는다.**
   저장소에 새 spec, test harness, test 설정을 남기지 않는다.

## 구현 계획

### 1. Core에 action-local 취소 상태 조회 API 추가

대상:

- `core/src/interfaces/StackflowPluginHook.ts`
- `core/src/utils/triggerPreEffectHooks.ts`

작업:

- `StackflowPluginPreEffectHook<T>`의 `actions`에
  `isPrevented: () => boolean`을 추가한다.
- `triggerPreEffectHook()`가 이미 소유한 action-local 취소 상태를 읽는 closure를 모든
  pre-effect hook에 전달한다.
- closure는 현재 hook 호출 시점의 snapshot이 아니라 현재 action invocation의 live
  값을 반환하게 한다.
- hook 순회, action param 누적 override, 최종 `PreEffectHookResult.isPrevented`와
  `makeActions()`의 dispatch 생략 로직은 변경하지 않는다.

### 2. React 내장 plugin-loader의 작업 시작 경계 수정

대상:

- `integrations/react/src/loader/loaderPlugin.tsx`

작업:

- `createBeforeRouteHandler()`가 받은 hook action에서 취소 상태를 가장 먼저 확인한다.
- 이미 예방됐다면 loader/preload/pause/override 경로에 진입하지 않고 반환한다.
- 내장 loader의 등록 순서는 바꾸지 않는다. 마지막에 실행되어야 앞선 사용자 플러그인이
  만든 최종 취소 상태와 action param override를 모두 볼 수 있다.
- `@stackflow/react`의 Core peer 범위를 `^3.0.0`으로 올리고 새 API를 직접 사용한다.
  새 예방 계약은 Core와 React를 함께 갱신할 때 활성화된다.

### 3. 공개 plugin API 문서 갱신

대상:

- `docs/pages/docs/advanced/write-plugin.en.mdx`
- `docs/pages/docs/advanced/write-plugin.ko.mdx`

작업:

- pre-effect hook action 표에 `actions.isPrevented`를 추가한다.
- `preventDefault()`가 이후 hook 실행까지 중단하는 API가 아니라는 점과, 후속 hook이
  `isPrevented()`로 상태를 판별할 수 있다는 점을 짧게 명시한다.

### 4. 릴리즈 메타데이터 추가

대상:

- `.changeset/fep-2635-observe-prevented-actions.md`
- `.changeset/fep-2635-skip-prevented-loader-work.md`

작업:

- `@stackflow/core`: **minor** — 공개 pre-effect hook API 추가.
- `@stackflow/react`: **patch** — Prevented Action에서 loader의 작업과 Stack pause를
  시작하던 버그 수정 및 Core v3 peer 계약 반영.
- 패키지별 릴리즈 내용을 독립된 changeset으로 기록한다.

## 검증 계획

저장소 테스트 파일은 만들거나 수정하지 않는다. 구현자는 `/tmp/FEP-2635/` 아래의
일회성 실행 파일과 기존 명령만 사용해 다음을 검증하고, 저장소 diff에는 검증용 파일을
남기지 않는다.

### Runtime 확인

`makeCoreStore()`에 예방 플러그인과 실제 `loaderPlugin()`을 순서대로 등록한
throwaway harness로 push와 replace를 각각 확인한다.

- 예방된 action:
  - 앞선 hook에서 `isPrevented()`는 처음에 `false`, `preventDefault()` 직후 `true`
  - 뒤의 hook과 loader hook에서 `true`
  - loader 호출 0회, lazy `_load()`/structured content preload 호출 0회
  - 새 `Paused`, `Resumed`, `Pushed`, `Replaced` event 없음
  - Activity 목록 불변, `globalTransitionState === "idle"`, `pausedEvents` 없음
- 정상 action 대조군:
  - loader와 preload가 기존과 같이 실행됨
  - pending 작업이면 pause되고 navigation event가 queue됨
  - 작업 완료 후 resume되어 navigation이 적용됨
- 중첩 action:
  - 안쪽 action의 예방 여부가 바깥 action의 조회 결과를 오염시키지 않음

### 기존 검증 명령

1. `yarn workspace @stackflow/core test`
2. `yarn workspace @stackflow/core typecheck`
3. `yarn workspace @stackflow/core build`
4. `yarn workspace @stackflow/react typecheck`
5. `yarn workspace @stackflow/react build`
6. `yarn workspace @stackflow/plugin-blocker test`
7. `yarn lint`
8. `yarn changeset status`
9. `git diff --check`

## 비목표

- [FEP-2636](https://linear.app/daangn/issue/FEP-2636)의
  `Paused → Resumed` 사이에 queued event가 없을 때 Stack이 paused에 남는 Core
  reducer 결함 수정
- `preventDefault()` 이후의 pre-effect hook 순회 중단
- `preventDefault()`를 되돌리는 `allowDefault()` 계열 API
- plugin 등록 순서 변경
- loader, lazy component, Suspense 또는 immediate-render 정책 변경
- `plugin-blocker` 구현이나 테스트 변경
- 구버전 Core 호환을 위한 capability check나 compatibility shim

## 산출물과 커밋 경계

- 설계 문서: `CONTEXT.md`,
  `docs/adr/0001-observe-prevented-actions-without-short-circuiting-hooks.md`, 이 계획
- Core 공개 API와 문서
- React loader bug fix
- Core minor + React patch changeset

이미 존재하는 커밋은 수정하지 않는다. 구현 변경은 새 커밋으로 쌓고, 최소한
Core API와 React bug fix의 의미 경계가 diff에서 구분되도록 한다.

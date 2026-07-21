# FEP-2598 작업 계획 — react 내장 plugin-loader의 core v3 지원

- 이슈: [FEP-2598](https://linear.app/daangn/issue/FEP-2598) `stackflow/react에서 stackflow/core v3 지원하기`
- 상태: 스펙 확정 (2026-07-21, 인터뷰 완료)

## 배경

core v3에서 스냅샷 기반 초기화(load path)가 추가되면서 `overrideInitialEvents`가 받는
이벤트가 `PushedEvent | StepPushedEvent`에서 `SnapshotEvent`(전체 replay 시퀀스 +
`initInfo` 판별자)로 확장됐다. react 내장 loaderPlugin
(`integrations/react/src/loader/loaderPlugin.tsx`)은 v2 시절 가정(초기 이벤트 = 진입
`Pushed` 몇 개)으로 작성되어, load path에서 다음이 깨진다:

- 죽은 activity(이후 pop/replace로 사라진)의 `Pushed`에도 loader가 전부 실행된다 —
  불필요한 네트워크 요청 등 사이드이펙트.
- `Replaced`로 진입한 alive activity는 loaderData를 받지 못해 `useLoaderData`가 깨진다.
- SSR용 `initialContext.initialLoaderData`가 replay 내 모든 `Pushed`에 잘못 붙는다.

참고: react의 peerDep은 이미 `core ^2 || ^3`(FEP-2590)이고, `StackflowReactPlugin`은
core 플러그인 타입을 그대로 확장하므로 v3 훅 타입 표면은 자동으로 따라온다. 이번 작업의
대상은 loaderPlugin의 동작이다.

## 확정 스펙

1. **불변식**: 복원된 스택에서 렌더 가능한 모든 activity는, loader가 정의돼 있다면
   fresh한 `loaderData`를 가진다. 이벤트 단위가 아닌 **최종 재구성 스택의 activity
   단위** 보장이다.
2. **렌더 가능 경계**: `transitionState !== "exit-done"` — 렌더러
   (`basicRendererPlugin`)의 실제 렌더 기준과 일치. `exit-active`(mid-pop 복원) 포함.
3. **경로 판별**: `initInfo?.kind === "load"`일 때만 load 동작. `initInfo` 부재
   (= core v2 런타임)나 `"create"`는 기존 create 동작을 바이트 단위로 보존한다.
   버전/기능 감지는 하지 않는다.
4. **stale 데이터 불신**: 스냅샷에 저장된 `activityContext.loaderData`는 절대
   재사용하지 않고 fresh loader 실행으로 덮어쓴다. `activityContext`의 나머지 필드는
   보존. loader가 없는 activity의 이벤트는 stale 필드가 있어도 건드리지 않는다.
5. **`initialLoaderData`는 create 전용**: load path에서는 완전히 무시한다. 서버가
   계산한 대상과 복원 스택의 대응을 일반화할 수 없고, 그로 인한 hydration mismatch는
   snapshot provider의 책임 영역이다.
6. **loader 실패 ≠ load 실패**: `SnapshotLoadError`로 승격하지 않고 `onLoadError`도
   트리거하지 않는다. create path와 동일하게 콘솔 에러 + 렌더 시점 에러 바운더리로
   처리한다.

## load path 메커니즘

1. 전달받은 replay 시퀀스(loaderPlugin은 체인 마지막이므로 다른 플러그인이 재구성한
   최종본)에 현재 config 기반 static 이벤트를 합성·backdate하여 `aggregate`로 최종
   스택을 계산한다.
2. `transitionState !== "exit-done"`이고 loader가 정의된 activity마다 loader를
   **1회** 실행한다 — 인자는 해당 activity의 **최종** name/params.
3. 그 activity의 `activityId`를 가진 `Pushed`/`Replaced` 이벤트의
   `activityContext.loaderData`에 실행 결과를 붙인다. 같은 `activityId`에 진입
   이벤트가 복수인 경우(id 유지 replace) 전부 같은 promise로 장식해도 aggregate가
   마지막 것을 채택하므로 동등하다. (`Pushed`/`Replaced` 모두
   `makeActivityFromEvent`가 `context: event.activityContext`를 채택함을 확인함.)
4. 그 외 이벤트(`Popped`/step 계열/`Paused`/`Resumed`, 죽은 activity의 진입
   이벤트)는 무조건 통과. 이벤트의 id/date/순서/구성원은 절대 변경하지 않는다.
5. loader promise 실패는 create path와 동일하게 `printLoaderDataPromiseError`로
   출력한다.

## 비목표

- 런타임 훅(`onBeforePush`/`onBeforeReplace`)의 pause/resume·lazy preload 동작 변경
- create path 동작 변경(`initialLoaderData`를 모든 `Pushed`에 붙이는 기존 quirk 포함)
- 시퀀스 재구성/re-dating — "settled 복원 보장" 같은 load policy는 제공하지 않음
  (snapshot provider나 별도 플러그인의 몫)
- load path에서의 lazy 컴포넌트 preload — 초기화엔 보호할 전환이 없음, Suspense가 처리
- plugin-history-sync의 load path 대응 (FEP-2001 영역)

## 테스트 계획

`makeCoreStore` + `provideSnapshot` 플러그인으로 실제 load path를 구동하는 spec 추가:

- alive activity에만 loader 실행 (죽은 activity의 loader 미실행 검증)
- `Replaced`로 진입한 alive activity의 loaderData 장식
- 저장된 stale loaderData 덮어쓰기 / loader 없는 activity 통과
- load path에서 `initialLoaderData` 무시, create path에서는 기존 동작 유지
- `initInfo` 부재 시(v2 시뮬레이션) create 동작 보존
- loader reject가 `SnapshotLoadError`로 승격되지 않음

## 릴리즈·커밋

- changeset: `@stackflow/react` **patch** (`fix:` — 선언된 `^2 || ^3` 호환성 대비
  버그픽스, FEP-2590 선례와 동일)
- 커밋은 작은 의미 단위로 분리: 구현+테스트 → changeset

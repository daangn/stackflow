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
7. **create path도 `Replaced`를 진입 이벤트로 처리한다**: v3에서
   `overrideInitialEvents` 체인의 타입이 `SnapshotEvent[]`로 넓어져 create path에서도
   앞선 플러그인이 `Replaced`를 포함한 시퀀스를 반환할 수 있다. 기존 **eager 방식
   그대로** `Replaced`를 `Pushed`와 동일하게 취급한다(`initialLoaderData` 부착 규칙
   포함) — deferred+onInit으로 통일하지 않는 이유는 create path의 SSR이 `init()`
   없이 `overrideInitialEvents`의 eager 부착에 의존하기 때문. `[Pushed A,
   Replaced B]`처럼 죽는 activity(A)의 loader가 실행되는 낭비는 수용한다 —
   aliveness 판정에 core 재구성 로직 복제가 필요해지는 것보다 낫고, create
   시퀀스는 짧다. v2 타입상 create 체인에 `Replaced`가 등장할 수 없으므로 v2-합법
   입력에 대한 동작은 변하지 않는다(스펙 3과 양립).

## load path 메커니즘

두 단계로 나뉜다: `overrideInitialEvents`에서 deferred를 심고, `onInit`에서 core가
실제로 계산한 최종 스택을 보고 resolve한다. react 플러그인 안에서 static 이벤트
합성·backdate·aggregate로 core의 load 재구성 로직을 복제하지 않기 위함이다 —
aliveness 판정의 진실 원천은 core가 계산한 스택 하나뿐이다.

1. **`overrideInitialEvents` (load일 때만)**: loader가 정의된 activity의 모든
   `Pushed`/`Replaced` 이벤트의 `activityContext.loaderData`에 **sync-inspectable
   deferred**를 심는다. loader가 없는 activity의 이벤트와 그 외 이벤트(`Popped`/
   step 계열/`Paused`/`Resumed`)는 무조건 통과. 이벤트의 id/date/순서/구성원은
   절대 변경하지 않는다.
2. **`onInit` (load일 때만)**: `getStack()`으로 core가 계산한 최종 스택을 읽어,
   `transitionState !== "exit-done"`이고 loader가 정의된 activity마다 loader를
   **1회** 실행한다 — 인자는 해당 activity의 **최종** name/params. 실행 결과로
   `activity.context.loaderData`(= 1에서 심은 deferred)를 resolve한다. aggregate가
   진입 이벤트의 `activityContext`를 `activity.context`로 채택하므로
   (`makeActivityFromEvent` 확인) activityId 부기는 불필요하다.
3. **죽은 activity의 deferred는 pending으로 방치한다.** exit-done은 렌더되지 않아
   소비자가 없고, `undefined` resolve보다 "이 데이터는 오지 않는다"를 정직하게
   표현한다. 이벤트 로그가 앱 수명 동안 유지되므로 메모리 델타도 없다.
4. loader promise 실패는 create path와 동일하게 `printLoaderDataPromiseError`로
   출력한다.

### 타이밍·의미 보존 근거

- `store.init()`(→ `onInit`)은 `stackflow.tsx`에서 store 생성 직후 같은 `useMemo`
  안에서 동기 호출된다 — activity 첫 렌더 전에 resolve가 완료된다.
- `useLoaderData`는 `useThenable`로 promise의 `status` 필드를 동기 inspect한다.
  따라서 deferred는 naked Promise가 아니라 **SyncInspectablePromise 규약을 따르는
  커스텀 deferred**여야 한다: resolve 시 비-thenable 값이면 `status`/`value`를
  동기로 갱신한다. 이로써 동기 loader가 첫 렌더에서 suspend 없이 그려지는 create
  path와의 의미 대칭이 유지된다 (naked Promise는 adoption이 마이크로태스크를 거쳐
  동기 loader조차 Suspense fallback이 한 번 번쩍인다).
- `onInit`은 `initInfo`를 받으므로 load 게이팅이 가능하고, v2에서는 `initInfo`
  부재로 자연스럽게 비활성화된다(스펙 3과 일관).

## 비목표

- 런타임 훅(`onBeforePush`/`onBeforeReplace`)의 pause/resume·lazy preload 동작 변경
- create path 동작 변경 — 단, `Replaced` 진입 이벤트 처리 확장(스펙 7)은 예외.
  `initialLoaderData`를 모든 진입 이벤트에 붙이는 기존 quirk은 유지
- 시퀀스 재구성/re-dating — "settled 복원 보장" 같은 load policy는 제공하지 않음
  (snapshot provider나 별도 플러그인의 몫)
- load path에서의 lazy 컴포넌트 preload — 초기화엔 보호할 전환이 없음, Suspense가 처리
- plugin-history-sync의 load path 대응 (FEP-2001 영역)
- **load path + SSR** — `store.init()`은 `isBrowser()`일 때만 호출되므로 서버 렌더
  중 스냅샷이 제공되면 loader deferred가 pending으로 남는다. 스냅샷 복원은
  본질적으로 클라이언트 시나리오이고(`initialLoaderData`를 create 전용으로 정한
  것과 일관) 현 persister도 서버에선 스냅샷을 제공하지 않으므로 미지원으로 명시

## 테스트 계획

`makeCoreStore` + `provideSnapshot` 플러그인으로 실제 load path를 구동(`store.init()`
호출 포함)하는 spec 추가:

- alive activity에만 loader 실행 (죽은 activity의 loader 미실행 검증)
- `Replaced`로 진입한 alive activity의 loaderData resolve
- 동기 loader의 결과가 `init()` 직후 동기 inspect로 FULFILLED (suspend 없는 첫 렌더
  보장 — create path와의 의미 대칭)
- 죽은 activity의 deferred는 pending 유지
- 저장된 stale loaderData 덮어쓰기 / loader 없는 activity 통과
- load path에서 `initialLoaderData` 무시, create path에서는 기존 동작 유지
- create path에서 `Replaced` 포함 시퀀스: `Replaced` 진입 activity에 fresh loader
  실행 및 `initialLoaderData` 부착 (eager — `init()` 호출 없이도 동작)
- `initInfo` 부재 시(v2 시뮬레이션) create 동작 보존 (deferred 미주입)
- loader reject가 `SnapshotLoadError`로 승격되지 않음

## 릴리즈·커밋

- changeset: `@stackflow/react` **patch** (`fix:` — 선언된 `^2 || ^3` 호환성 대비
  버그픽스, FEP-2590 선례와 동일)
- 커밋은 작은 의미 단위로 분리: 구현+테스트 → changeset

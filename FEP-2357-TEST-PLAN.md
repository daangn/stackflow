# FEP-2357 테스트 계획: `prepare` / `usePrepare`

> 기준 문서: `FEP-2357-SPEC.md` (single source of truth — "추가 확정 사항" 섹션 포함).
> 모든 테스트는 `@stackflow/react`의 Public API(`integrations/react/src/index.ts` export 기준)와
> `@stackflow/config`의 Public API만 사용한다. 내부 모듈(`SyncInspectablePromise`,
> `loaderPlugin`, `_load`, 내부 Context 등) 직접 접근 금지.
> 스펙이 **명시적 미규정(Unspecified)** 으로 남긴 동작(loader 디듀프, chunk 중복 발사,
> 부분 발사 원자성/취소)은 테스트가 **어느 방향으로도 단언하지 않는다** — §5 참고.

## 0. 실행 환경

- 실행: `yarn workspace @stackflow/react test` (Jest + jsdom + @swc/jest)
- 타입 검증: `yarn workspace @stackflow/react typecheck` (`tsconfig.test.json`, spec 포함)
- 스펙 파일 위치: `integrations/react/src/*.spec.tsx`
- 스타일: given-when-then 주석 패턴 (`extensions/plugin-blocker/src/blockerPlugin.spec.tsx` 참고),
  렌더가 필요한 테스트는 인라인 렌더러 플러그인 사용 (`harness.smoke.spec.tsx` 패턴 —
  `@stackflow/plugin-renderer-basic`은 워크스페이스 순환 의존이라 사용 불가)
- **import 경계**: 패키지 내부 spec은 모두 `./index`(public entry)에서 import한다.
  `"@stackflow/react"` 패키지명 import는 `dist`(빌드 산출물)를 가리키므로 **금지** —
  작업 중인 `src` 변경 대신 stale artifact를 검증하게 된다. package export 검증은
  별도 build/publish 테스트의 책임이다. (`harness.smoke.spec.tsx`와 동일한 경계)

## 1. 파일 구성

| 파일 | 내용 |
|---|---|
| `integrations/react/src/prepare.spec.tsx` | A·B·C·E·F (런타임 규약) |
| `integrations/react/src/usePrepare.spec.tsx` | D (래퍼 동등성) |
| `integrations/react/src/prepare.types.spec.tsx` | G (타입 안전성) + 최소 런타임 항목(A1 배치) |

주의:

- 타입 테스트 파일도 반드시 `*.spec.tsx`로 명명한다 — 빌드 tsconfig/esbuild가 `*.spec.*`을
  제외하므로 dist 오염이 없고, `tsconfig.test.json`은 spec을 포함하므로 typecheck가 검증한다.
- `@swc/jest`는 타입을 검사하지 않으므로 `@ts-expect-error` 대상 코드가 **런타임에 실행되면
  안 된다** → 타입 단언은 절대 호출되지 않는 함수 본문 안에 배치한다.
- Jest는 spec 파일에 최소 1개 테스트를 요구하므로 G 파일에 런타임 항목(A1)을 함께 둔다.
- `declare module "@stackflow/config"`의 `Register` 증강은 패키지 전역으로 병합된다.
  spec 파일 간 이름 충돌 방지를 위해 activity 이름에 `Prepare` 접두사를 사용한다
  (예: `PrepareLazyActivity`, `PrepareLoaderActivity` — `SmokeActivity`는 이미 사용 중).

## 2. 공통 픽스처 / 유틸리티

```ts
// 제어 가능한 비동기 작업
function createDeferred<T>(): { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void };

// pending 검사: then-플래그 + 마이크로태스크 flush. Promise 내부 구조에 의존하지 않는다.
async function isSettled(p: Promise<unknown>): Promise<boolean>;
// 구현 스케치: let settled = false; p.then(() => { settled = true; }, () => { settled = true; });
//              await flushMicrotasks(); return settled;
```

- **인라인 렌더러 플러그인**: `harness.smoke.spec.tsx`의 `testRendererPlugin` 패턴.
  E4(마운트 중 chunk pending)에서는 activity 렌더를 `<React.Suspense fallback>`으로 감싼
  변형이 필요하다 (lazy 컴포넌트가 pending chunk에서 suspend하므로).
- **spy 플러그인**: `onInit({ actions })`에서 `getStack` 캡처 + `onChanged`/`onBeforePush`를
  `jest.fn`으로 기록 (blockerPlugin.spec.tsx 패턴).
- **lazy 픽스처**: `lazy(jest.fn(() => deferred.promise))` — 사용자가 공급하는 import 함수의
  호출 여부/인자는 공개 경계에서의 관찰이다 (횟수 단언 허용 범위는 §4 자체 점검 참고).
  - **디듀프-불가지(agnostic) 픽스처**: 중복 호출이 등장하는 테스트(E1)의 import 함수는
    **호출될 때마다 동일한 deferred.promise를 반환**해야 한다 — 구현이 디듀프하든 안 하든
    테스트 결과가 같도록. (chunk 중복 발사 여부는 스펙 미규정 — §5)
- **loader 픽스처**: `defineConfig`의 activity에 `loader: jest.fn(...)` — 마찬가지로 사용자
  공급 함수. 인자 형태는 공개 타입 `ActivityLoaderArgs`(`{ params, config }`)로 단언한다.
  F1에서는 동기 값을 반환하는 loader(`() => ({ message: "loaded" })`)를 사용해 렌더를
  결정적으로 만든다.
- **미등록 activity 런타임 호출**: 타입이 컴파일 타임에 차단하므로(G1) 런타임 테스트(A8, D2)는
  `as any` 캐스트로 우회해 호출한다.

---

## 3. 테스트 항목

표기: 각 항목 끝의 `[근거]`는 스펙 문구(§는 스펙의 절)다.
각 항목은 단일 규약을 검증하며, Then은 그 규약의 직접 관찰만 단언한다.

### A. `prepare` 기본 규약 — `stackflow()` 출력, 렌더 없이 호출

#### A1. `stackflow()` 출력에 `prepare` 함수가 포함된다
- **Given**: `defineConfig` + components로 `stackflow()`를 호출한다.
- **When**: 반환 객체를 확인한다.
- **Then**: `typeof prepare === "function"`이다.
- [근거: 스펙 §1 "stackflow() 출력에 prepare 추가"]

#### A2. params 생략 시 component chunk 로드만 발사하고 data loader는 호출하지 않는다
- **Given**: `loader: jest.fn()`이 설정된 activity와 `lazy(jest.fn(() => Promise.resolve({ default: Comp })))` 컴포넌트.
- **When**: `await prepare("PrepareLazyActivity")` — params 없이 호출한다.
- **Then**: import 함수는 호출되고, loader는 호출되지 않는다.
- [근거: 스펙 §2 "params 생략 → chunk만 preload"]

#### A3. params 전달 시 chunk 로드와 data loader를 모두 발사한다
- **Given**: `loader: jest.fn()` + lazy 컴포넌트(import `jest.fn`)인 activity.
- **When**: `await prepare("PrepareLazyActivity", { id: "1" })`.
- **Then**: loader가 `expect.objectContaining({ params: { id: "1" }, config: expect.anything() })` 인자로 호출되고, import 함수도 호출된다.
- [근거: 스펙 §2 "params 전달 → chunk + data loader까지 발사", `ActivityLoaderArgs` 공개 타입]

#### A4. loader가 없는 activity에 params를 전달해도 에러 없이 resolve된다
- **Given**: loader 없는 config + lazy 컴포넌트.
- **When**: `prepare("A", { id: "1" })`.
- **Then**: 반환 Promise가 에러 없이 resolve된다. (chunk 발사 검증은 A2의 규약)
- [근거: 스펙 "현행 동작" — loader는 "있으면" 호출]

#### A5. lazy도 structured도 아닌 일반 컴포넌트는 아무 작업도 발사하지 않고 resolve된다
- **Given**: 일반 함수 컴포넌트, loader 없는 activity.
- **When**: `prepare("A")`.
- **Then**: 반환 Promise가 에러 없이 resolve된다.
- [근거: 스펙 "현행 동작" — 발사 조건(lazy/structured/loader)에 해당하지 않으면 발사할 작업이 없음]

#### A6. `structuredActivityComponent`의 dynamic content는 content import를 발사한다
- **Given**: `structuredActivityComponent({ content: jest.fn(() => Promise.resolve({ default: content(Comp) })) })`.
- **When**: `await prepare("A")`.
- **Then**: content import 함수가 호출된다.
- [근거: 스펙 "현행 동작" — structured + dynamic content → content chunk preload 발사]

#### A7. `structuredActivityComponent`의 정적 content는 추가 로드 없이 resolve된다
- **Given**: `structuredActivityComponent({ content: content(Comp) })` — content가 함수가 아닌 정적 값.
- **When**: `prepare("A")`.
- **Then**: 반환 Promise가 에러 없이 resolve된다 (동적 import 함수가 없으므로 호출 검증 대상도 없음).
- [근거: 스펙 "현행 동작" — "content가 dynamic import 함수인 경우"에만 발사]

#### A8. 미등록 activity 이름으로 호출하면 `Activity ${name} is not registered.` 에러로 reject된다
- **Given**: `"Known"` activity만 등록된 stackflow 인스턴스.
- **When**: `const p = prepare("Unknown" as any)`.
- **Then**: `p`가 `Activity Unknown is not registered.` 메시지의 Error로 reject된다.
  (동기 throw라면 호출 시점에 테스트가 실패하므로, 이 단언이 "throw가 아닌 reject" 계약을 함께 고정한다)
- [근거: 스펙 "현행 동작" — 미등록 이름 에러, 스펙 "추가 확정 사항 — 에러 전달 방식": 모든 실패는 Promise reject로 전달]

#### A9. 빈 객체 params도 "params 전달"로 취급되어 loader가 호출된다
- **Given**: 파라미터가 없는(`{}` 타입) activity + `loader: jest.fn()`.
- **When**: `await prepare("A", {})`.
- **Then**: loader가 호출된다 (`prepare("A")`처럼 생략한 경우와 달리).
- [근거: 스펙 "현행 동작" — "activityParams가 주어지고 loader가 있으면 호출". 파라미터 없는 activity의 데이터 preload 경로를 고정]

### B. 반환 Promise 의미 — 모든 작업 완료 시에만 resolve

#### B1. chunk 로드가 완료되기 전에는 resolve되지 않고, 완료되면 resolve된다
- **Given**: deferred로 제어되는 lazy import 함수.
- **When**: `const p = prepare("A")` 후 마이크로태스크를 flush한다.
- **Then**: `p`는 아직 settle되지 않았다. deferred를 resolve하면 `p`가 resolve된다.
- [근거: 스펙 §2 "반환 Promise는 모든 preload 작업 완료 시 resolve"]

#### B2. loader만 완료되고 chunk가 미완료인 동안에는 resolve되지 않는다 (중간 상태 미노출)
- **Given**: deferred 2개 — loader는 `() => loaderDeferred.promise`, lazy import는 `() => chunkDeferred.promise`.
- **When**: `const p = prepare("A", params)`; `loaderDeferred.resolve(...)`; flush.
- **Then**: `p`는 여전히 pending. `chunkDeferred.resolve(...)` 후 resolve된다.
- [근거: 동일 — "모든" 작업 완료]

#### B3. chunk만 완료되고 loader가 미완료인 동안에는 resolve되지 않는다 (B2의 대칭)
- **Given**: B2와 동일한 픽스처.
- **When**: `const p = prepare("A", params)`; `chunkDeferred.resolve(...)`; flush.
- **Then**: `p`는 여전히 pending. `loaderDeferred.resolve(...)` 후 resolve된다.
- [근거: 동일]

### C. React 밖 / 렌더 전 호출 가능성

#### C1. `<Stack>` 렌더 없이(React 트리 부재) `prepare`가 완전한 동작을 한다
- **Given**: `stackflow()` 호출 직후, 어떤 컴포넌트도 렌더하지 않은 상태 (loader + lazy activity).
- **When**: `await prepare("A", params)`.
- **Then**: loader와 import 함수가 모두 호출된다.
- 참고: A·B 절 전체가 렌더 없이 실행되어 사실상 이 전제를 상시 검증하지만, 이 항목은 "렌더
  이전·React 바깥 호출 가능"을 명시적 규약으로 고정하는 대표 테스트다.
- [근거: 스펙 §1 "`<Stack>` 마운트 이전에도 즉시 동작", 요구사항 "React 렌더링 이전에 호출 가능"]

#### C2. 렌더 전 `prepare` 호출이 이후 `<Stack>` 마운트를 방해하지 않는다
- **Given**: lazy activity `"A"`에 대해 `await prepare("A")` 완료. `initialActivity`는 일반 컴포넌트 `"Main"`.
- **When**: `render(<Stack />)` (인라인 렌더러 플러그인).
- **Then**: `"Main"`이 정상 렌더된다.
- [근거: 스펙 사용 시나리오 (A) — 부트스트랩에서 prepare 후 정상 렌더]

### D. `usePrepare` 래퍼 동등성

#### D1. `usePrepare`가 반환한 함수도 chunk + data를 동일하게 발사한다
- **Given**: `<Stack>` 렌더(초기 activity 내부에서 `usePrepare()` 반환값을 외부 변수로 캡처).
  별도의 lazy + loader activity `"B"`.
- **When**: 캡처한 함수로 `await capturedPrepare("B", { id: "1" })`.
- **Then**: loader가 `objectContaining({ params: { id: "1" } })` 인자로 호출되고, import 함수가 호출된다 — A3과 동일한 관찰 결과.
- [근거: 스펙 §3 "usePrepare는 동일 로직을 감싸는 얇은 래퍼", "현행 동작… 새 prepare도 동일해야 함"]

#### D2. `usePrepare`가 반환한 함수도 미등록 activity에 동일 에러로 reject된다
- **Given**: D1과 동일하게 캡처한 함수.
- **When**: `capturedPrepare("Unknown" as any)`.
- **Then**: `Activity Unknown is not registered.` 에러로 reject된다 — A8과 동일.
- [근거: 동일, 스펙 "추가 확정 사항 — 에러 전달 방식"]

### E. 동시성 · 경쟁 상태 · 실패

#### E1. 동일 activity에 대한 동시 중복 `prepare` — 두 Promise 모두 작업 완료 후 각각 resolve된다
- **Given**: deferred chunk를 가진 lazy activity. import 함수는 호출마다 **동일한**
  deferred.promise를 반환한다(디듀프-불가지 픽스처 — §2).
- **When**: `const p1 = prepare("A"); const p2 = prepare("A");` flush → 둘 다 pending 확인 → deferred resolve.
- **Then**: `p1`, `p2` 모두 resolve된다. (import 함수/loader의 호출 횟수는 단언하지 않는다 — 스펙 미규정, §5)
- [근거: 스펙 §2의 Promise 의미를 호출 단위로 적용 — 각 호출의 Promise는 독립적으로 완료를 보고한다]

#### E2. 서로 다른 activity의 동시 `prepare`는 서로 간섭하지 않는다
- **Given**: `"A"`(chunkA deferred), `"B"`(chunkB deferred) — 둘 다 lazy.
- **When**: `const pA = prepare("A"); const pB = prepare("B");` → `chunkB`만 resolve → flush.
- **Then**: `pB`는 resolve되고 `pA`는 여전히 pending이다. `chunkA` resolve 후 `pA`도 resolve된다.
- [근거: 호출별 독립성 — 각 호출의 Promise는 "자신이 발사한" 작업 완료에만 묶인다(스펙 §2)]

#### E3. `prepare` 진행 중 같은 activity로 `push`가 발생해도 push는 정상 완료된다
- **Given**: `<Stack>` 렌더(initial: 일반 `"Main"`), deferred chunk의 lazy `"A"`, spy 플러그인(getStack). `prepare("A")` 발사(미완료).
- **When**: `actions.push("A", {})` 호출 → 이후 deferred resolve → settle 대기.
- **Then**: 스택이 기존 + 1개가 되고 top이 `"A"`(`enteredBy.name === "Pushed"`)다.
- [근거: 스펙 §1 "core store를 건드리지 않음" — prepare가 내비게이션과 경쟁해도 push 시맨틱 불변]

#### E4. `prepare` 진행 중 `<Stack>` 마운트(부트스트랩 시나리오)도 정상 동작한다
- **Given**: deferred chunk의 lazy `"A"`(loader 없음), `initialActivity: () => "A"`. Suspense 래핑 인라인 렌더러. `prepare("A")` 발사 직후(미완료).
- **When**: `render(<Stack />)` → deferred resolve → settle 대기.
- **Then**: `"A"`의 콘텐츠가 렌더된다.
- [근거: 스펙 사용 시나리오 (A) — "앱 부트스트랩 / 라우팅 진입 직전" 호출과 렌더의 중첩]

#### E5. loader가 동기 throw하면 반환 Promise는 해당 에러로 reject된다
- **Given**: `loader: () => { throw err; }`인 activity (+ lazy 컴포넌트).
- **When**: `const p = prepare("A", params)`.
- **Then**: `p`가 `err`로 reject된다 (동기 throw로 전파되지 않는다).
  chunk 발사 여부는 단언하지 않는다 — 부분 발사 원자성은 스펙 미규정(§5).
- [근거: 스펙 "추가 확정 사항 — 실패 전파": 원본 reason으로 reject / "에러 전달 방식": throw가 아닌 reject]

#### E6. loader가 비동기 reject하면 반환 Promise는 해당 reason으로 reject된다
- **Given**: `loader: () => Promise.reject(err)`인 activity.
- **When**: `const p = prepare("A", params)`.
- **Then**: `p`가 `err`로 reject된다.
- [근거: 스펙 "추가 확정 사항 — 실패 전파"]

#### E7. chunk 로드가 reject하면 반환 Promise는 해당 reason으로 reject된다
- **Given**: `lazy(() => Promise.reject(err))`인 activity.
- **When**: `const p = prepare("A")`.
- **Then**: `p`가 `err`로 reject된다.
- [근거: 스펙 "추가 확정 사항 — 실패 전파"]

#### E8. chunk 로드 실패 후 같은 activity를 다시 `prepare`하면 로드를 재시도한다
- **Given**: 첫 호출은 reject, 두 번째 호출은 resolve하는 lazy import
  (`jest.fn().mockRejectedValueOnce(err).mockResolvedValueOnce({ default: Comp })`).
- **When**: `prepare("A")`의 reject를 확인한 뒤 → `const p2 = prepare("A")`.
- **Then**: import 함수가 다시 호출되고(총 2회) `p2`는 resolve된다.
  (재호출이 곧 "재시도" 계약의 직접 관찰이다 — 캐시된 실패가 반환되면 p2가 reject되어 구분된다)
- [근거: 스펙 "추가 확정 사항 — 실패 후 재시도": 실패가 캐시를 영구 오염시키지 않는다]

#### E9. `prepare` 실패가 이후 내비게이션과 다른 `prepare`를 오염시키지 않는다 (오류 격리 invariant)
- **Given**: loader가 reject하는 `"A"`, 정상 lazy + loader의 `"B"`, `<Stack>` 렌더 + spy 플러그인.
- **When**: `prepare("A", params)`의 reject를 확인한 뒤 → `await prepare("B", params)` → `actions.push("B", params)`.
- **Then**: `prepare("B")`는 resolve되고, push 후 스택 top이 `"B"`다.
- [근거: 단일 출처 인스턴스(스펙 §1)에서 호출 간 독립성 — 실패가 인스턴스 상태를 손상시키지 않아야 함]

#### E10. `prepare`는 스택 상태를 변경하지 않으며 내비게이션 이벤트를 발생시키지 않는다
- **Given**: `<Stack>` 렌더, spy 플러그인(`getStack` + `onChanged`/`onBeforePush`/`onPushed`를 `jest.fn`으로 기록), loader + lazy의 `"A"`.
- **When**: 스택 스냅샷 채취 → `await prepare("A", params)` → 재채취.
- **Then**: `getStack().activities`가 prepare 전후 동등하고, 기록된 플러그인 훅(`onChanged`/`onBeforePush`/`onPushed`)이 prepare로 인해 추가 호출되지 않았다.
  (두 단언 모두 "core store 미접촉"이라는 단일 규약의 관찰 지점이다)
- [근거: 스펙 §1 "actions와 달리 core store를 건드리지 않으므로"]

### F. `loaderPlugin`과의 책임 분리

> 주의: 이 절은 호출 횟수를 단언하지 않는다. loader 디듀프·chunk 중복 발사 여부는
> 스펙 미규정(§5)이며, 여기서는 "prepare가 기존 내비게이션 경로(loaderData 주입·lazy 렌더)를
> 방해하지 않는다"는 책임 분리만 검증한다.

#### F1. `prepare` 후 `push`해도 loaderData 주입은 loaderPlugin 경로로 정상 동작한다
- **Given**: 동기 데이터를 반환하는 `loader: () => ({ message: "loaded" })`의 `"A"`,
  `"A"` 컴포넌트는 `useLoaderData()` 값을 렌더. `<Stack>` 렌더(initial: `"Main"`).
- **When**: `await prepare("A", params)` → `actions.push("A", params)` → settle 대기.
- **Then**: `"A"`가 loader 데이터(`"loaded"`)와 함께 렌더된다 — prepare가 loaderData 주입
  경로를 가로채거나 망가뜨리지 않는다.
- [근거: 스펙 §2 "로더 결과를 저장하진 않으며… 실제 loaderData 주입은 기존 loaderPlugin이 담당"]

#### F2. `prepare` 완료 후 `push`하면 lazy activity가 정상 렌더된다
- **Given**: `lazy(() => Promise.resolve({ default: Comp }))`의 `"A"`, `<Stack>` 렌더(initial: `"Main"`).
- **When**: `await prepare("A")` → `actions.push("A", {})` → settle 대기.
- **Then**: `"A"`의 콘텐츠가 렌더된다 — 워밍된 chunk가 이후 내비게이션 렌더를 방해하지 않는다.
  (import 호출 횟수는 단언하지 않는다 — 스펙 미규정, §5)
- [근거: 스펙 §2 "캐시 워밍/네트워크 발사가 목적" — prepare→push 시퀀스의 무간섭]

### G. 타입 안전성 — `yarn typecheck`로 검증 (`prepare.types.spec.tsx`)

> 모든 타입 단언은 **절대 호출되지 않는 함수 본문** 안에 배치한다(런타임 부작용 방지).
> `@ts-expect-error`는 "다음 줄에 컴파일 에러가 있어야 통과" 시맨틱이므로, 규약이 깨지면
> typecheck가 실패한다. import는 `./index`(public entry)에서만 한다 — §0 import 경계 참고.

#### G1. 미등록 activity 이름은 컴파일 에러다
- **Given**: `Register`에 증강되지 않은 이름.
- **When**: `// @ts-expect-error` + `prepare("NotRegistered")`.
- **Then**: typecheck 통과(= 해당 줄이 실제로 에러).
- [근거: 스펙 "타입 안전성 — 잘못된 activity 이름·파라미터는 컴파일 타임에 차단"]

#### G2. 잘못된 params 타입은 컴파일 에러다
- **Given**: `Register`에 `{ id: string }`으로 증강된 activity.
- **When**: `// @ts-expect-error` + `prepare("A", { id: 123 })`, `// @ts-expect-error` + `prepare("A", { wrong: "x" })`.
- **Then**: typecheck 통과.
- [근거: 동일 — `InferActivityParams<K>` 흐름]

#### G3. params는 생략 가능하고 반환 타입은 `Promise<void>`다
- **Given**: 등록된 activity.
- **When**: `const r1: Promise<void> = prepare("A");` / `const r2: Promise<void> = prepare("A", validParams);`.
- **Then**: 에러 없이 typecheck 통과.
- [근거: 스펙 §2 `Prepare` 시그니처 — 옵셔널 params, `Promise<void>` 반환]

#### G4. `stackflow()` 출력 `prepare`와 `usePrepare` 반환값은 모두 `Prepare` 타입과 상호 할당 가능하다
- **Given**: `import { stackflow, usePrepare, type Prepare } from "./index"`.
- **When**: `const _a: Prepare = output.prepare;` / `declare const up: ReturnType<typeof usePrepare>; const _b: Prepare = up;` 및 역방향 할당.
- **Then**: 에러 없이 typecheck 통과 — 두 진입점이 동일한 공개 시그니처를 공유한다.
- [근거: 스펙 §3 "기존 usePrepare가 돌려주던 `Prepare` 타입/이름 그대로 재사용"]

---

## 4. 자체 점검 — 구현 상세가 아닌 공개 규약인가

| 점검 | 결과 |
|---|---|
| 사용 API | `stackflow`, `lazy`, `structuredActivityComponent`/`content`, `usePrepare`, `useLoaderData`, `Prepare`, `StackflowReactPlugin`(스파이/렌더러), `Actions`(push), `defineConfig`/`ActivityLoaderArgs`(@stackflow/config) — 전부 public export |
| import 경계 | 패키지 내부 spec은 `./index`(public entry)만 사용. `"@stackflow/react"` 패키지명 import 금지(dist를 가리킴) |
| 비사용(금지) | `SyncInspectablePromise`, `preloadableLazyComponent`, `loaderPlugin` 직접 import, `_load` 직접 접근, 내부 Context, `getContentComponent` |
| `jest.fn` import/loader 호출 단언 | import 함수·loader는 **사용자가 공급하는 값**이므로 호출 여부·인자는 공개 경계의 관찰이다. 호출 **횟수** 단언은 계약이 횟수를 직접 함의하는 곳에만 둔다 — chunk-only의 loader 미호출(A2), 실패 후 재시도의 재호출(E8). **디듀프/중복 발사 관련 횟수는 어디에서도 단언하지 않는다**(스펙 미규정) |
| 미규정 동작 보호 | loader 디듀프(OQ-1)·chunk 중복 발사(OQ-2)·부분 발사 원자성/취소(OQ-5)는 어느 방향으로도 단언하지 않음. E1은 디듀프-불가지 픽스처 사용, E5는 chunk 발사 여부 미단언, F절은 횟수 대신 경로 정상 동작만 검증 |
| Promise pending 검사 | then-콜백 플래그 + 마이크로태스크 flush — `Promise.all` 등 내부 구성에 의존하지 않음 |
| 스택 상태 단언 | spy 플러그인의 공개 `actions.getStack()` 경유 (기존 blockerPlugin spec과 동일 패턴) |
| 렌더 단언 | Testing Library `screen` — DOM 관찰 |
| 단언 범위 | 한 항목 = 단일 규약. Then은 해당 규약의 직접 관찰만 단언하며, 인접 규약(resolve 의미·렌더 성공 등)은 그 규약을 담당하는 항목에 위임 |

## 5. 스펙 확정 사항과 테스트 매핑

스펙 오너가 `FEP-2357-SPEC.md` "추가 확정 사항"(2026-06-04)으로 확정한 내용과
이 계획의 대응이다.

### 계약으로 확정 → 테스트로 고정

| 확정 계약 | 검증 항목 |
|---|---|
| 에러 전달 방식 — 모든 실패는 동기 throw가 아닌 **Promise reject** (구 OQ-3) | A8, D2, E5(throw 미전파) |
| 실패 전파 — loader/chunk 실패 시 **원본 reason으로 reject** (구 OQ-4) | E5, E6, E7 |
| 실패 후 재시도 — chunk 실패 후 재-`prepare`는 **로드 재시도** (구 OQ-6) | E8 |

### 명시적 미규정 → 단언 금지 가드레일

| 미규정 동작 | 계획의 대응 |
|---|---|
| 중복 `prepare` 시 data loader 디듀프 여부 (구 OQ-1) | 어떤 항목도 중복 호출 시 loader 횟수를 단언하지 않음. E1은 Promise 의미만 검증 |
| chunk import 중복 발사 여부 — `lazy()` 구현의 캐시에 맡김 (구 OQ-2) | E1은 디듀프-불가지 픽스처(호출마다 동일 promise 반환) 사용. F2는 횟수 대신 렌더 무간섭만 검증 |
| 부분 발사 원자성/취소 (구 OQ-5) | E5는 reject만 단언하고 chunk 발사 여부는 단언하지 않음. 취소 관련 테스트 없음 |

> 이전 rev에서 호출 횟수로 디듀프/워밍을 고정하던 항목(중복 prepare 시 loader 재호출,
> 중복 prepare 시 chunk 1회, prepare→push loader 2회/import 1회)은 미규정 침해이므로
> **제거 또는 재구성**했다(F1·F2는 경로 정상 동작 검증으로 전환).

## 6. 항목 요약

| 절 | 항목 수 | 내용 |
|---|---|---|
| A | 9 | 기본 규약 (chunk-only / chunk+data / structured / 미등록 / 경계) |
| B | 3 | 반환 Promise 의미 (전체 완료 시 resolve, 중간 상태 미노출) |
| C | 2 | React 밖 / 렌더 전 호출 |
| D | 2 | usePrepare 래퍼 동등성 |
| E | 10 | 동시성 · 재진입 · 경쟁 상태 · 실패 · 재시도 · invariant |
| F | 2 | loaderPlugin 책임 분리 (주입 경로·렌더 무간섭 — 횟수 단언 없음) |
| G | 4 | 타입 안전성 (typecheck 기반) |
| **계** | **32** | 스펙 "추가 확정 사항" 반영 완료 — 계약 3건 고정, 미규정 3건 단언 금지 준수 |

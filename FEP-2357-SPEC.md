# FEP-2357: React 맥락 바깥에서 Activity Component / 데이터 preload 지원

> 이 문서는 Linear FEP-2357 이슈 본문 + 확정된 인터페이스 기획안(이슈 코멘트)을 워킹트리로 옮긴 것이다.
> 테스트 기획/구현/리뷰의 단일 기준(source of truth)이다.

## 배경

Stackflow React integration에서 activity 진입 전 chunk/데이터를 미리 로드하는 로직은 현재
`usePrepare` 훅으로 제공된다(`integrations/react/src/usePrepare.ts`). 그러나 이 훅은 React
Context에 의존하기 때문에(`useConfig`, `useDataLoader`, `useActivityComponentMap`)
**React 렌더링 트리 내부에서만** 호출할 수 있다.

이로 인해 **React Render 이전 시점**(앱 부트스트랩 단계, 라우팅 진입 직전 등 React 바깥
맥락)에서는 activity component chunk와 관련 데이터를 preload 할 수 없다.

## 요구사항

- React Context에 의존하지 않고, React 렌더링 이전에 호출 가능한 형태로 preload 기능을 제공한다.
- preload 대상: activity component chunk(lazy loaded component), 그리고 관련 데이터(activity
  config의 data loader).
- TypeScript 타입 안전성은 그대로 유지한다(잘못된 activity 이름/파라미터는 컴파일 타임에
  걸러져야 함).

## 확정된 인터페이스 (변경 불가)

### 1. 어디에 — `stackflow()` 출력에 `prepare` 추가

```ts
const { Stack, actions, stepActions, prepare } = stackflow({
  config,
  components,
  plugins,
});
```

- `actions` / `stepActions`와 동일한 "렌더 밖 호출용" 선례를 따름.
- `config`·`components`를 다시 넘길 필요 없이 **같은 stackflow 인스턴스 1개**에서 나오므로
  단일 출처 보장.
- `actions`와 달리 **core store를 건드리지 않으므로**, `stackflow()`가 호출되는 모듈 평가
  시점부터 즉시 동작 가능 — `<Stack>` 마운트 이전에도.

### 2. 어떤 형태 — 현행 단일 시그니처 유지

```ts
type Prepare = <K extends RegisteredActivityName>(
  activityName: K,
  activityParams?: InferActivityParams<K>,
) => Promise<void>;
```

- `params` 생략 → activity component chunk만 preload.
- `params` 전달 → chunk + 해당 activity data loader까지 발사.
- 반환 `Promise`는 모든 preload 작업 완료 시 resolve. 로더 결과를 저장하진 않으며(캐시
  워밍/네트워크 발사가 목적), 실제 loaderData 주입은 기존 `loaderPlugin`이 담당.

### 3. 이름 — `prepare` 유지

- 기존 `usePrepare`가 돌려주던 `Prepare` 타입/이름 그대로 재사용.
- `usePrepare`는 동일 로직을 감싸는 얇은 래퍼로 전환 → React 트리 안의 기존 호출자 무중단,
  렌더 밖/안이 단일 구현 공유.

### 타입 안전성

`RegisteredActivityName` · `InferActivityParams<K>` 제네릭이 그대로 흐르므로 잘못된 activity
이름·파라미터는 **컴파일 타임에 차단**된다.

### 사용 시나리오

```ts
// (A) React 밖 — 앱 부트스트랩 / 라우팅 진입 직전
prepare("Article", { articleId: "123" }); // chunk + data 미리 발사
prepare("Article");                        // chunk만

// (B) React 안 — 기존 코드 그대로 동작
const prepare = usePrepare();
```

## 현행 동작 참고 (usePrepare 기준)

현행 `usePrepare`가 반환하는 `prepare`의 관찰 가능한 동작(새 `prepare`도 동일해야 함):

- 등록되지 않은 activity 이름 → `Activity ${name} is not registered.` 에러를 throw.
- `activityParams`가 주어지고 activity config에 `loader`가 있으면 loader를 호출.
- 컴포넌트가 `lazy()`로 만들어진 경우(`_load` 보유) chunk 로드를 발사.
- 컴포넌트가 `structuredActivityComponent()`이고 `content`가 dynamic import 함수인 경우
  content chunk preload를 발사.
- 반환 Promise는 위에서 발사된 모든 작업이 완료되면 resolve.

## 추가 확정 사항 (2026-06-04, 스펙 오너 결정)

테스트 기획 과정에서 제기된 미결정 사항(Open Questions)에 대한 스펙 오너의 확정.

### 계약으로 확정 (테스트로 고정한다)

- **에러 전달 방식**: 미등록 activity 등 모든 실패는 동기 throw가 아니라 **반환 Promise의
  reject**로 전달된다. (OQ-3)
- **실패 전파**: loader/chunk 로드 실패 시 반환 Promise는 **원본 reason으로 reject**된다.
  항상-resolve+로깅이 아니다. (OQ-4)
- **실패 후 재시도**: chunk 로드 실패 후 같은 activity를 다시 `prepare`하면 chunk 로드를
  **재시도한다**. 실패가 캐시를 영구 오염시키지 않는다. (OQ-6)

> **문서화 안내**: 실패가 reject로 전파되므로, 사용 시나리오 (A)처럼 fire-and-forget으로
> 호출하는 경우 unhandled rejection을 피하기 위해 `.catch` 사용을 권장한다는 안내를 공식
> 문서에 포함해야 한다. (예: `prepare("Article", { ... }).catch(() => {})`)

### 명시적 미규정 (Unspecified behavior — 테스트로 고정하지 않는다)

아래는 구현 상세로 남긴다. 테스트는 이 동작을 어느 방향으로도 단언해서는 안 된다.

- **중복 `prepare` 시 data loader 디듀프 여부** — 현재 구현은 디듀프하지 않지만 계약이
  아니다. (OQ-1)
- **chunk import 중복 발사 여부** — `lazy()` 구현의 캐시에 맡긴다. `prepare` 레벨 계약이
  아니다. (OQ-2)
- **부분 발사 원자성/취소** — loader 동기 throw 시 나머지 preload 발사 여부는 보장하지
  않는다. 취소(cancellation)도 제공하지 않는다. (OQ-5)

## 관련 소스

- `integrations/react/src/usePrepare.ts` — 현행 훅 (이관 대상 로직)
- `integrations/react/src/stackflow.tsx` — `stackflow()` 팩토리, `loadData` 클로저
- `integrations/react/src/lazy.tsx` — `lazy()` / `_load`
- `integrations/react/src/StructuredActivityComponentType.tsx` — structured component / preload
- `integrations/react/src/index.ts` — 패키지 public entry

# Stackflow core — Stack 초기화의 create/load 구분 메커니즘 설계 (FEP-2548)

> 이 문서는 stackflow core에 Stack 초기화(bootstrap) 시 생성(create)과 복원(load) 경로의 구분을 도입하는 메커니즘 설계서다.
> 요구사항 정본은 Linear FEP-2548 코멘트(2026-07-07 인터뷰 확정)와 레포 `CONTEXT.md`(용어 정의)이며,
> 본문에서 R1–R13으로 인용한다. 코드 구현은 후속 작업이다 — 이 문서의 고도는 메커니즘
> (원리·공개 계약·타이밍·불변식)이다. 설계가 전제하는 현행 소스 동작은 §10에 파일:라인으로 모두 인용했다.

---

## 0. 요약

**스냅샷 = 탐색 이벤트 로그, load = 기존 aggregate로의 재생(replay).**

현행 core는 이벤트 소싱으로 동작한다 — 스택 상태는 항상 `aggregate(events, now)`의 산출물이다(§10-S1).
따라서 "보존된 탐색 맥락"의 자연스러운 물화는 core가 이미 처리한 탐색 이벤트의 로그이고,
"복원"의 자연스러운 물화는 그 로그를 기존 aggregate에 다시 먹이는 것이다.
load를 위한 새 상태 주입 경로·새 도메인 이벤트를 만들지 않는다 — 검증기의 본체는
기존 `validateEvents` + 리듀서이고, load 경로는 여기에 기존 등록 술어(activityName ∈ 등록 집합)를
activity 도입 이벤트 전수(Pushed·Replaced)로 확장 적용하는 검사 하나만 더한다
(현행 `validateEvents`가 Replaced를 검사하지 않는 간극의 보완 — §3.4).

신규 공개 표면은 네 조각이 전부다:

| 표면 | 종류 | 용도 |
|---|---|---|
| `StackSnapshot` | 타입 (core 소유) | 스냅샷 형식 |
| `actions.captureSnapshot()` | actions 메서드 | 캡처 |
| `provideSnapshot` | 플러그인 옵셔널 훅 | load 진입 (단일 스냅샷 자리) |
| `onLoadError` | 플러그인 옵셔널 훅 | load 실패 1차 처리 (공급자 전용) |

여기에 기존 `onInit` 훅의 인자에 일회성 신호 `initializedBy: "create" | "load"`를 추가한다.
초기화(initialize)는 부트스트랩 상위 개념이다 — `onInit`·`store.init`·`initializedBy`는 create·load
두 경로 모두에서 발화하며, `create`/`load`는 그 경로 값이다(`initializedBy: "load"`는 "스토어가
초기화됐다 — load 경로로"의 뜻이지 모순이 아니다). create 경로의 최초 진입 가로채기는 전용 훅을
두지 않고 기존 `overrideInitialEvents` 체인에서의 검사·strip(차단)·치환(리다이렉트)으로 이뤄진다(§3.5).
신규 도메인 이벤트 0, 신규 Stack 상태 속성 0, react 앱 개발자 향한 신규 표면 0,
`makeCoreStore` 옵션 추가 0. 스냅샷 공급자가 없으면 생성 시퀀스는 오늘의 코드 경로와
관찰상 동일하다(§6 R8).

---

## 1. 문제와 요구사항

### 1.1 문제

core에는 현재 "Stack이 어떻게 태어났는가"의 어휘가 없다. 모든 생성은 `makeCoreStore(initialEvents)`
한 경로이며, 초기 진입은 플러그인의 `overrideInitialEvents`로만 변형할 수 있다(§10-S3).
그 결과:

- **persister(FEP-2546)**: 탐색 맥락을 보존했다가 되살리는 왕복(캡처→보존→load)을 core 계약만으로
  구성할 방법이 없다. 스냅샷의 형식·캡처·복원이 전부 미정의다.
- **activity guard(FEP-2521)**: 런타임 push는 `onBeforePush`로 가로챌 수 있지만, 생성 시점의
  최초 진입은 액션 파이프라인을 타지 않아(§10-S4) 가로챌 표면이 없다. 또한 "복원된 스택은 보존
  시점에 이미 검증되었으므로 가드를 건너뛴다"는 정책을 세울 근거(create/load 구분)가 없다.
- **history-sync(FEP-2001)**: "스택을 진실의 원천으로 삼아 브라우저 히스토리를 동기화"하는 방향으로
  개정하려면, 자신이 URL을 해석해 스택을 만드는 경우(create)와 보존된 스택을 되살려 히스토리를 맞추는
  경우(load)를 구분할 신호가 필요하다.

### 1.2 확정 요구사항 (정본: Linear FEP-2548, `CONTEXT.md`)

- **R1** load 경계 소스 불문: 스냅샷 복원은 저장 매체 무관 전부 load
- **R2** 이진 분류: core 어휘는 create/load 둘뿐 (deep link 세분은 core 어휘 아님)
- **R3** 생성 시점 동기 load만: "복원 대기 중" 중간 상태 없음, 비동기 소스는 상위 레이어 부트스트랩 문제
- **R4** load 실패 = 명시적 에러 (조용한 폴백 금지)
- **R5** 에러 1차 처리자 = 스냅샷 공급자 (앱 개발자는 기본 무관여)
- **R6** create 진입은 가로채기 가능(의미상 push), load 진입은 가로채기 대상 아님
- **R7** create/load 구분은 생성 시점 일회성 신호 (지속 속성 아님)
- **R8** non-breaking: `overrideInitialEvents` 유지, 그 결과는 create 취급
- **R9** 단일 스냅샷 자리: 생성은 스냅샷 최대 1개, 경합 조정은 core 위 계층
- **R10** 스냅샷 왕복(캡처→보존→load)은 core 계약만으로 닫힘
- **R11** load 사후조건: 스냅샷이 보존한 정상 상태(불변식 충족 = 도달 가능 상태)의 충실한 재구성
- **R12** 복원 범위: 탐색 기록(`stack.activities`)이 필수, 나머지(transitionDuration·
  globalTransitionState·pausedEvents·registeredActivities)는 부가·복원 비필수. 전환 정보 폐기는 열린 선택
- **R13** 직렬화는 core 밖: codec은 스냅샷 사용자 책임. core는 `activityParams`·`activityContext`에
  어떤 값이 와도 동작을 전제하지 않음. "형식 소유"는 구조의 소유이며 보존 매체 인코딩은 제외

**비목표**: late load / create 하위 세분화의 core 어휘화 / 구분의 지속 속성화 /
react 앱 개발자 향한 신규 표면 / 스냅샷 버전 마이그레이션 보장(비호환 = load 실패).

### 1.3 방법론 참고 — 복원 시스템의 알려진 실패 모드

타 생태계의 복원 시스템(브라우저 세션 복원, Android `SavedInstanceState`, react-navigation
state persistence, XState persisted state)이 공통으로 겪는 실패 모드를 설계 단계에서 회피한다:

1. **무한 성장 로그** — 보존물이 세션 길이에 비례해 자람 → §9 compaction 로드맵으로 대응
   (계약은 크기가 아니라 재생 결과만 보장).
2. **스키마-저장 결합** — 코드가 바뀌면 낡은 보존물이 조용히 깨짐 → `$schema` 태그로 시끄러운
   실패(비목표 승인: 비호환 = load 실패), 정적 정보(등록 목록·전환 시간)는 보존하지 않고 load 시점
   현행 config에서 재파생.
3. **복원 대기 레이스** — "복원 중" 중간 상태가 초기 렌더와 경합 → R3(생성 시점 동기 load)이
   이 상태 자체를 금지. 비동기 소스는 스택 생성을 지연하는 상위 부트스트랩의 문제.

---

## 2. 소비자로부터의 역산 — 이 계약이 어디서 나왔는가

계약을 제시하기 전에, 세 소비자가 자연스럽게 쓰게 될 코드를 먼저 보인다. 아래 세 코드가 성립하는 데
필요한 최소 core 표면이 곧 §3의 공개 계약이다. **소비자의 사용 코드에 등장하지 않는 표면은 만들지
않는다**가 이 설계의 절제 원칙이다.

### 2.1 persister (FEP-2546) — 캡처→보존→load 왕복

```ts
const persisterPlugin = ({ storage, codec }): StackflowPlugin => () => ({
  key: "persister",

  // [캡처] 스택이 바뀔 때마다 스냅샷을 떠서 보존한다. codec은 내 책임(R13).
  onChanged({ actions }) {
    storage.write(codec.encode(actions.captureSnapshot()));
  },

  // [load 진입] 스택 생성 시점에 동기적으로 스냅샷을 공급한다.
  provideSnapshot() {
    const raw = storage.read();
    return raw ? codec.decode(raw) : null;   // null = "복원할 것 없음" → create
  },

  // [에러 1차 처리] 손상 스냅샷은 내가 치우고 create 재시도를 지시한다.
  onLoadError({ error }) {
    storage.remove();
    report(error);
    return { recover: "create" };              // 명시적 결정 — 조용한 폴백이 아님
  },
});
```

### 2.2 activity guard (FEP-2521) — create 가로채기·load 스킵

```ts
// makePushed·isEntered는 guard 저자의 헬퍼(초기 이벤트 배열 위에서만 도는 순수 함수)다.
const guardPlugin = ({ canEnter }): StackflowPlugin => () => ({
  key: "guard",

  // [create 진입] 초기 이벤트 배열을 검사해 strip(차단)/치환(리다이렉트)한다.
  // guard는 초기 이벤트 생성자(history-sync 등)보다 뒤에 배치해야 한다(순서 규율 — §7.2).
  overrideInitialEvents({ initialEvents, initialContext }) {
    const out: typeof initialEvents = [];
    let dropGroup = false;
    for (const e of initialEvents) {
      if (e.name === "Pushed") {
        const verdict = canEnter(e.activityName, e.activityParams);
        dropGroup = !verdict.ok;
        if (!verdict.ok) {
          if (verdict.redirect) out.push(makePushed(verdict.redirect, e.eventDate));
          continue;                        // strip = 차단
        }
        out.push(e);
      } else if (!dropGroup) {
        out.push(e);                       // 딸린 StepPushed는 직전 Pushed 그룹으로 탈락
      }
    }
    return out;
  },

  // [런타임 push] 기존 파이프라인 — 무변경.
  onBeforePush({ actionParams, actions }) {
    if (!canEnter(actionParams.activityName, actionParams.activityParams).ok) {
      actions.preventDefault();
    }
  },

  // [검증 벨트] 순서 오배치로 인한 침묵 우회를 개발 시점의 큰 소리로 전환한다.
  // 집행이 아니라 검증이다(사후 축출은 SSR 공백·흔적·중간 수술 불가 — §3.5·§7.2).
  onInit({ actions, initializedBy }) {
    if (initializedBy !== "create") return;   // load는 검증된 맥락 — 스킵(R6)
    for (const a of actions.getStack().activities) {
      if (isEntered(a) && !canEnter(a.name, a.params).ok) {
        throw new Error(
          `guard: '${a.name}' entered unguarded — guardPlugin must be placed ` +
            "after initial-event generators (e.g. historySyncPlugin).",
        );
      }
    }
  },
});
```

create 진입 가로채기가 전용 훅이 아니라 기존 `overrideInitialEvents`의 용법이라는 것이 이 소비자의
핵심이다 — strip/치환이 R6의 검사·차단·변경을 전부 제공한다(성립 논증은 §7.2). load 스킵은 정책
코드가 아니라 경로 구조로 성립한다(load는 `overrideInitialEvents` 체인을 건너뜀).

### 2.3 history-sync (FEP-2001 개정 방향) — 스택을 진실의 원천으로

```ts
// 미래의 history-sync: history.state에 스냅샷을 실어 두고 복원 시 공급자가 된다.
provideSnapshot() {
  return decodeSnapshotFromHistoryState(history.location.state); // 없으면 null
},
onInit({ actions, initializedBy }) {
  if (initializedBy === "load") {
    rewriteBrowserHistoryToMatch(actions.getStack()); // 스택이 진실 — history를 맞춘다
  } else {
    /* 현행 create 동작 그대로 */
  }
},
```

역산 결과가 §0의 네 표면 + `onInit` 인자 1개다. 특히 create 진입 가로채기는 새 표면이 아니라 기존
`overrideInitialEvents`의 용법으로 성립한다(§2.2). 이 외의 표면(신규 도메인 이벤트, Stack 상태 속성,
react 표면, `makeCoreStore` 옵션, create 전용 가로채기 훅)은 어떤 소비자의 사용 코드에도 등장하지
않으므로 만들지 않는다.

---

## 3. 공개 계약

### 3.1 스냅샷 형식 — 소유: core, 직렬화: 소비자 (R10·R13)

```ts
/** 탐색 이벤트 6종 — 기존 이벤트 타입의 부분합(신규 어휘 없음) */
type NavigationEvent =
  | PushedEvent | ReplacedEvent | PoppedEvent
  | StepPushedEvent | StepReplacedEvent | StepPoppedEvent;

/** core가 구조를 소유하는 plain-data 값. 보존 매체 인코딩(codec)은 사용자 책임. */
type StackSnapshot = {
  /** 구조 판별 태그. 불일치 → SnapshotLoadError (마이그레이션은 비목표). */
  $schema: "stackflow.snapshot.v1";
  /** 탐색 이벤트만 담는다. Initialized·ActivityRegistered는 담지 않는다 — load 시점의
   *  현행 config에서 재파생한다(R12: transitionDuration·registeredActivities는 복원 비필수).
   *  Paused·Resumed도 담지 않는다 — 전환·일시정지 정보로서 폐기한다(R12: 폐기가 열린 선택). */
  events: NavigationEvent[];
};
```

계약의 성질:

- **plain-data**: 소비자가 자기 codec으로 직렬화/역직렬화한다. core는 `activityParams`·
  `activityContext`에 어떤 값이 있어도 동작을 전제하지 않는다(R13).
- **투명하되 재생 결과만 보장**: 구조가 문서화된 core 소유 타입이므로 공급자가 값을 변환할 수 있다
  (예: 스냅샷 이벤트의 `activityContext`에서 loader data를 제거하고 load 시 재파생해 주입 — §7.1.3).
  단, **계약이 보장하는 것은 "재생 시 탐색 기록의 충실 재구성"뿐이다.** 두 규칙을 분리해 명시한다:
  ① **값 변환은 허용** — 존재하는 이벤트의 필드 값(`activityContext` 등)을 읽고 변환하는 것은
  문서화된 타입 위의 정당한 사용이다. ② **집합·개수 가정은 금지** — "이 activity의 Pushed가 반드시
  존재한다", "push 횟수만큼 이벤트가 있다" 같은 이벤트 집합의 구성·완전성에 대한 가정은 계약 밖이다.
  ②가 core에 캡처 시 정준 축약(compaction)의 자유를 준다(§9).
- **정적 정보는 보존하지 않는다**: 등록 activity 목록과 transitionDuration은 보존 시점이 아니라
  **load 시점의 현행 config가 진실**이어야 한다. 앱 업데이트로 activity가 사라졌으면 낡은 등록
  정보로 스택을 살리는 게 아니라 load 실패로 시끄럽게 드러나야 한다(R4). 이를 봉인하는 것이
  load 등록 검사다(§3.4·L6): **activity를 물화하는 모든 이벤트(현행 어휘에서 Pushed·Replaced)의
  `activityName`이 load 시점 등록 집합에 속해야 한다.** Pushed는 기존 `validateEvents`가 이미
  검사하지만(§10-S6) Replaced는 검사하지 않으므로(§10-S6a — Replaced도 `activityName`으로
  activity를 물화한다), load 경로가 같은 술어를 Replaced까지 확장 적용한다.

### 3.2 캡처 방법

```ts
interface StackflowActions {
  // ...기존 그대로...
  /** 어느 훅에서든, 언제든 호출 가능. 현재 이벤트 로그를 탐색 이벤트로 정규화해 반환. */
  captureSnapshot(): StackSnapshot;
}
```

- **정규화**: 이벤트 로그(`events.value`)를 탐색 이벤트 6종으로 필터하고, aggregate의 전처리와
  같은 순서(eventDate 오름차순 정렬 + id 중복 제거 — §10-S7)로 정렬해 반환한다. 따라서
  **`events` 배열 순서가 곧 의미상 재생 순서**다 — load의 재기저 규칙(§4.2)이 이 순서를 입력으로 삼는다.
- **언제든 호출 가능**: 플러그인은 모든 훅에서 `actions`를 받으므로 추가 배선이 없다. 캡처 시점·보존
  위치·폐기 시점만이 공급자의 책임이라는 역할 분담(`CONTEXT.md` 스냅샷 항목) 그대로다.
- **전환 중 캡처**: 재생 시 전환 진행 상태는 폐기되고 정착 상태로 복원된다(R12가 허용하는 폐기).
- **pause 중 캡처**: Paused/Resumed는 스냅샷에서 제외되지만, pause 중 디스패치된 탐색 이벤트는
  이벤트 로그에 그대로 누적되므로(§10-S14) 캡처에 포함된다. 재생 결과는 "pause가 없었던 것처럼"
  큐잉된 항해가 전부 적용된 상태다 — R12가 열어 둔 폐기 선택의 행사이며, 이 문단이 그 명문화다.
  캡처 시점의 가시 상태와 복원 결과가 다를 수 있으므로, 이 사후조건은 공급자(persister 등)의
  사용자 문서에 명시할 항목이다.
- 반환값은 이벤트 로그와 구조를 공유하는 plain-data 값이다. 변환이 필요하면 복사 후 변환한다
  (직접 변이는 미정의 동작).

### 3.3 load 진입 방법 — 단일 스냅샷 자리 (R9)

```ts
type StackflowPlugin = () => {
  // ...기존 그대로...
  /** 스택 생성 시점에 동기 호출(R3). null(또는 undefined) = 공급할 것 없음.
   *  non-null을 반환한 플러그인이 2개 이상이면 core는 조정하지 않고 생성 에러를 던진다(R9). */
  provideSnapshot?: (args: { initialContext: any }) => StackSnapshot | null;
};
```

- **진입점은 이 훅 하나뿐이다.** `makeCoreStore` 옵션 파라미터는 두지 않는다 — 진입점이 둘이면
  R9의 "자리 하나"가 흐려진다. 비동기 소스를 기다렸다 스택 생성을 지연하는 상위 부트스트랩
  레이어(R3)는 인라인 플러그인 `() => ({ key: "boot", provideSnapshot: () => snap })` 한 줄로 충분하다.
- **선언적 반환 (명령형 `load()` 호출이 아니라)**: 값을 반환하는 형태이므로 "생성 중 1회만 호출
  가능한 함수"류의 호출 창(window) 계약과 그 오용 실패 모드(창 밖 호출·중복 호출)가 존재하지 않는다.
  또한 R9 강제가 시간 순서("먼저 부른 쪽이 이김")가 아니라 구조(전원 폴링 후 non-null 개수)로
  성립한다 — 플러그인 배열 순서에 무관하다.
- **환경 계약**: `provideSnapshot`은 스토어가 생성되는 모든 환경에서 폴링된다(SSR 렌더 포함).
  브라우저 전용 매체(localStorage·history.state 등)에 의존하는 공급자는 비브라우저 환경에서
  null을 반환할 책임이 있다 — 현행 history-sync가 서버에서 memory history로 스스로 강등하는
  것과 같은 역할 분담이다. 이 분담의 귀결로 서버는 create·클라이언트는 load로 생성될 수 있고,
  그때의 하이드레이션 불일치는 공급자·앱 계층이 다뤄야 한다(예: 서버 마크업과 무관한 시점으로
  복원을 미루거나 서버에도 같은 스냅샷을 공급) — core는 환경 간 일관성을 중재하지 않는다.
- **R9 위반은 설정 오류**: non-null 공급이 2개 이상이면 core는 충돌 플러그인 key들을 명시한
  생성 에러를 즉시 던진다. 이것은 `SnapshotLoadError`가 아니고 `onLoadError`로 라우팅되지 않는다 —
  특정 스냅샷의 결함이 아니라 배선 버그이며, "1차 처리자 = 공급자"를 적용할 단일 공급자가 정의되지
  않기 때문이다. 복수 공급 후보의 조정은 core 위 계층의 책임이다(R9 — §7.3 국면 3).

### 3.4 load 실패 에러 계약 (R4·R5)

```ts
class SnapshotLoadError extends Error {
  cause:
    | { kind: "incompatible-schema" }        // $schema 불일치 또는 v1 구조 위반
    | { kind: "invalid-events"; detail: unknown } // 재생 검증 실패 (validateEvents 위반 등)
    | { kind: "empty-navigation" };          // 재생 결과 enter 상태 activity 0개
}

type StackflowPlugin = () => {
  /** 자신이 공급한 스냅샷의 load가 실패했을 때, 그 공급자에게만 호출된다(R5).
   *  { recover: "create" } 반환 → core는 create 경로로 생성을 계속한다(공급자의 명시적 결정).
   *  void 반환 또는 핸들러 부재 → SnapshotLoadError가 makeCoreStore 밖으로 던져진다(R4). */
  onLoadError?: (args: {
    error: SnapshotLoadError;
    initialContext: any;
  }) => { recover: "create" } | void;
};
```

에러 분류 기준:

| kind | 의미 | 검출 지점 |
|---|---|---|
| `incompatible-schema` | 이 값은 core가 아는 v1 스냅샷 구조가 아니다 — `$schema` 불일치, `events`가 배열이 아님, 항목이 탐색 이벤트 6종이 아님, `id`/`name` 결손 | 재생 전 구조 검사 |
| `invalid-events` | 구조는 유효하나 이벤트 열이 현행 config에서 유효하지 않다 — 미등록 activity를 물화하는 이벤트(Pushed·Replaced) 등 | load 등록 검사(activity 도입 이벤트 전수의 activityName ∈ 등록 집합, §4.2-4) + 기존 `validateEvents`(§10-S6) throw 래핑 |
| `empty-navigation` | 재생은 성공했으나 enter 상태 activity가 0개 | 재생 후 사후조건 검사(§5 L3) |

- **load 등록 검사가 별도로 존재하는 이유**: 현행 `validateEvents`는 Pushed의 등록만 검사하고
  Replaced는 검사하지 않는다(§10-S6a). 이 간극은 런타임에도 존재하지만(`replace()`로 미등록
  activity 진입이 오늘도 침묵 통과한다), 런타임 `validateEvents`의 전역 확장은 기존 앱의 관찰
  가능 동작을 바꿀 수 있는 독립적 core 수정 후보라 이 설계에 결합하지 않는다(R8 절대 보존).
  load 경로는 새 표면이므로 처음부터 올바른 술어(activity 도입 이벤트 전수)를 적용하며, 전역
  수정이 후에 채택되면 load 검사를 자연히 흡수한다.
- `empty-navigation`을 에러로 두는 이유: 복원할 탐색 기록이 없으면 공급자는 null을 반환했어야
  한다(계약). activity 0개짜리 스택을 조용히 만들어 주는 것은 사용자 눈에 빈 화면 = 사실상 조용한
  실패이므로 R4의 정신에 따라 시끄럽게 처리한다. `{ events: [] }`도, 전부 pop된 이력도 여기서 잡힌다.
- **에러 전달이 콜백인 이유**: `makeCoreStore`가 그냥 throw하면 try/catch 가능한 유일한 위치인
  앱 개발자가 1차 처리자가 되어 R5 위반이다. 콜백의 반환값 `{ recover: "create" }`는 "조용한 폴백
  금지(R4)"와 "공급자가 복구 정책 결정(R5)"을 한 지점에서 화해시킨다 — 폴백이 일어나되, 스냅샷을
  폐기하고 로그를 남긴 공급자의 명시적 서명이 있는 폴백이다. 핸들러 부재·void 반환 시 throw가
  기본값인 것은 R4의 안전측이다(에러를 다루지 않는 공급자의 스냅샷 실패는 시끄럽게 죽는다).
- **복구는 재폴링하지 않는다**: `{ recover: "create" }`는 create 경로의 초기 이벤트 파이프라인부터
  재개하며 `provideSnapshot`을 다시 폴링하지 않는다 — 무한 루프를 차단하고 load 시도를 생성당
  1회로 고정한다(R3).
- 에러 채널은 동기다: load가 생성 시점 동기(R3)이므로 복구 결정도 동기여야 한다. 비동기 채널
  (이벤트·프라미스)은 "복원 대기 중" 중간 상태를 재도입하므로 두지 않는다.

### 3.5 create 진입 가로채기 지점 (R6)

create 경로의 최초 진입 가로채기는 **전용 훅 없이 기존 `overrideInitialEvents` 체인에서** 이뤄진다 —
플러그인이 초기 이벤트 배열을 받아 **검사·strip(차단)·치환(리다이렉트)** 한다. 이 셋이 R6이 요구하는
"검사·차단·변경"의 전부다(§2.2 guard 코드). 새 공개 훅을 도입하지 않는다.

**왜 strip이 preventDefault를 대신하는가 — 초기 이벤트는 pre-aggregate 데이터다.** 초기 이벤트는
액션 파이프라인을 타지 않는 배열 데이터이고(§10-S3·S4), `makeCoreStore`는 이 배열을
`overrideInitialEvents` 체인으로 reduce한 뒤 그 결과를 직접 집계한다(§10-S1). 이 시점의 "차단"은 어떤
실행 흐름을 멈추는 것이 아니라 **배열에서 원소를 빼는 것**이고, "변경"은 원소를 치환하는 것이다.
`preventDefault`라는 명령형 신호는 진행 중인 dispatch를 멈춰야 하는 런타임 액션의 어휘이지(§10-S5),
아직 데이터인 것의 어휘가 아니다. 또 초기 집계는 `stack.value` 직접 대입이라 post-effect 훅을
발화시키지 않으므로(§10-S2), "prevent하지 않으면 부수효과가 새어나간다"는 걱정도 create 경로엔 없다.
따라서 strip은 곧 prevent의 pre-aggregate 등가물이며, create 진입에 별도의 preventDefault 표면이
필요하지 않다.

**strip 단위 — 그룹 탈락**: strip된 Pushed에 뒤따르던 StepPushed는 함께 탈락한다 — 평탄 배열에서
StepPushed는 직전 Pushed가 만든 activity(그 시점 최신 활성 activity)를 타깃하므로(§10-S21), 배열
순회에서 "직전 Pushed가 strip되면 그에 딸린 StepPushed도 뺀다"가 집계 의미론과 일치한다(§2.2 코드의
`dropGroup`). Pushed를 빼고 StepPushed를 남기면 재생 시 그 StepPushed가 다른 activity로 오귀속된다.

**onInit은 집행이 아니라 검증이다**: 스택이 완성된 뒤(`onInit`, `initializedBy === "create"`)의
"가로채기"는 진입 차단이 아니라 **사후 축출**(pop/replace)이며, 집행 수단으로는 부적격이다 —
(1) `store.init()`은 브라우저 전용이라(§10-S10) 서버 렌더에는 차단 대상 activity가 그대로 실린다,
(2) 사후 pop은 Popped 이벤트·exit-done 잔존·post-effect 발화라는 관찰 가능한 흔적을 남긴다(§10-S9),
(3) 스택 중간 activity는 위를 전부 pop했다 다시 push하는 churn 없이 제거할 수 없다. 그러나 **같은
시점이 검증에는 정확히 맞는다** — 스택이 완성됐고 `initializedBy`로 경로를 구분할 수 있으므로 guard는
여기서 최종 스택을 정책과 대조해 위반 시 크게 실패시킬 수 있다(검증 벨트 — §7.2). 벨트는 순서
오배치라는 설정 오류를 침묵이 아니라 개발 시점의 예외로 전환한다.

**생성 중 항해 액션 금지**: 생성 중 훅(`provideSnapshot`·`onLoadError`)과 `overrideInitialEvents`
안에서 항해 액션(`push`/`pop`/`dispatchEvent` 등) 호출은 계약 위반이다 — 스토어가 아직 완성 전이다.
create 진입의 변형은 `overrideInitialEvents` 반환 배열로, 진입 후 리다이렉트는 `onInit` 이후에 한다.

**왜 create 진입을 기존 onBeforePush 액션 파이프라인으로 흘리지 않는가** — 이것은 이 설계의 중요한
부정 결정이다:

1. **완전 통일(초기 진입을 액션 경로로 흘리기)은 post-effect 훅까지 발화시킨다.** 액션 경로는
   pre-effect 훅 후 dispatch하고, dispatch는 post-effect 훅을 발화시킨다(§10-S5). 초기 진입이
   `onPushed`를 발화시키면 현행 history-sync의 `onPushed`(§10-S12)가 초기 activity마다
   `pushState`를 호출해 브라우저 히스토리에 중복 엔트리를 쌓는다 — 기존 앱이 즉시 깨진다(R8 위반).
2. **pre-effect 훅만 통일하는 절충도 R8을 확률로 떨어뜨린다.** 기존 onBeforePush 핸들러들은
   "스택이 완성된 뒤 런타임 push에만 불린다"는 전제로 작성되어 있다. 레포 안에 실증 반례가 있다:
   loader plugin의 `onBeforePush`는 loader가 pending이면 `pause()`를 호출한다(§10-S15) — 초기
   이벤트에 이 훅을 발화시키면 **생성 도중 Paused 이벤트가 디스패치**되어 현행과 다른 생성 시퀀스가
   된다. non-breaking은 확률이 아니라 보장이어야 한다.

그래서 create 가로채기는 액션 파이프라인이 아니라 `overrideInitialEvents` 체인(pre-aggregate 데이터
변형)에 둔다 — 이 위치가 위 두 오발화를 구조적으로 차단한다.

기각한 다른 대안:

- **create 전용 훅 신설(동형 시그니처의 `onBefore*Push` 류)**: `overrideInitialEvents`의 strip/치환이
  이미 R6의 검사·차단·변경을 전부 제공하므로 전용 훅은 부재보다 나은 표면이 아니다. 전용 훅만의 잔여
  가치는 "순서 무관의 구조적 집행 보장"(순서 문서·검증 벨트 없이도 guard가 항상 최종 초기 이벤트를
  본다)인데, (i) 이 생태계는 이미 플러그인 순서를 규율로 쓰고(loaderPlugin은 history-sync 뒤 —
  §10-S23), (ii) 침묵 실패는 검증 벨트로 가시화되며, (iii) 없이 출발했다 실사용에서 순서 사고가
  실증되면 동형 훅을 additive(비파괴)로 증분하는 길이 열려 있는 반면 훅을 넣었다 빼는 것은 breaking
  이라는 비대칭 위에서, 지금 지불할 표면이 아니다. 오배치 사고가 반복 실증되면 그것이 전용 훅을
  additive로 증분할 정확한 타이밍이다.
- **`onInit`에서 집행**: 위 "onInit은 집행이 아니라 검증" — 사후 축출은 SSR 공백·흔적·중간 수술
  불가로 집행 부적격이다. 검증 벨트로만 유효하다.
- **가로채기 없음**: R6 위반.

### 3.6 일회성 신호 (R7)

```ts
/** onInit 인자 확장(순수 additive) — Stack 상태에는 어떤 흔적도 남지 않는다. */
onInit?: (args: {
  actions: StackflowActions;
  initializedBy: "create" | "load";
}) => void;
```

- 신호는 `onInit` 인자로만 존재한다. Stack에 조회 가능한 지속 속성이 없고, 신규 도메인 이벤트도
  없으므로 이벤트 로그에도 구분의 흔적이 없다 — R7과 비목표("구분의 지속 속성화")가 by construction
  성립한다. 이를 알아야 하는 소비자는 생성 시점에 부착되어 있어야 한다는 `CONTEXT.md`의 관계
  정의 그대로다.
- 이름이 `initializedBy`인 이유 — 초기화(initialize)는 부트스트랩 상위 개념이다: `onInit`·
  `store.init`·`initializedBy`는 create·load 두 경로 모두에서 발화하며, `create`/`load`는 그 경로
  값이다. `initializedBy: "load"`는 모순이 아니라 "스토어가 초기화됐다 — load 경로로"를 뜻한다.
  `onInit`이라는 훅 이름과 `Initialized` 도메인 이벤트를 그대로 두는 것도 이 상위 개념과 정합한다
  (설정 사건). 신호 이름에 entry류(진입)를 쓰지 않는 이유는 `CONTEXT.md`에서 **진입(Entry)은
  activity 수준 용어**이기 때문이다("Activity가 Stack에 나타나게 되는 사건") — 스택 초기화 신호와
  도메인 어휘가 충돌한다. `initializedBy`는 "Stack은 Create 또는 Load 중 정확히 하나의 경로로
  만들어진다"는 관계 정의에 직결되고, 값이 이진 문자열 리터럴인 것은 R2(이진 분류가 core 어휘의
  전부)의 표현이다.
- 현행 `onInit`은 `{ actions }` 단일 인자로 발화하므로(§10-S13) 필드 추가는 순수 additive다.
  레포 내 `onInit` 사용자 6개(blocker·devtools·GA4·history-sync·lifecycle·stack-depth-change)는
  인자를 무시하거나(GA4는 무인자 `onInit()` 선언) `actions`만 구조분해한다 — 어떤 기존 플러그인도
  영향받지 않는다.
- **activity 단위 출처는 표현하지 않는다**: load는 생성 시점에만 일어나므로(R3) 출처가 의미 있을
  유일한 순간(생성 직후)에는 답이 자명하다 — 전부 스냅샷 출신이다. `onInit`에서 `initializedBy === "load"`를
  본 소비자는 `getStack()`의 모든 activity가 복원물임을 이미 알고, 이후 push되는 activity는 정의상
  신규다. 세 소비자의 사용 코드(§2) 어디에도 per-activity 출처 조회가 등장하지 않는다. 재생된
  activity의 `enteredBy`는 스냅샷 속 원본 Pushed/Replaced 이벤트로 유지되어(§10-S9), 생성 이후의
  세계는 create 출신과 구별 불가능하게 균질하다. 기각 대안 — `enteredBy`에 Loaded류 마킹이나 신규
  이벤트 어휘: 새 도메인 이벤트 + 지속 속성 + 소비자 부재의 삼중 지불. 관측 요구(devtools 등)가
  실증되면 `onInit` 신호를 구독해 자체 기록하는 비침습 경로가 있다.

---

## 4. 생성 시퀀스

### 4.1 create 경로 — 스냅샷 공급자 없음 (전원 null)

```
makeCoreStore(options)
 1. 플러그인 인스턴스화 (현행 그대로)
 2. provideSnapshot 전원 폴링 → 전부 null → create 경로 확정
 3. options.initialEvents를 [Pushed/StepPushed | 나머지(정적)]로 분리   (현행 §10-S3)
 4. overrideInitialEvents 체인 (현행 그대로 — 무변경 유지, R8)
    — guard 등 create 가로채기 소비자는 이 체인에서 초기 이벤트를 검사·strip·치환한다(§3.5)
 5. onInitialActivityIgnored / onInitialActivityNotFound 핸들러
    — overrideInitialEvents 체인이 끝난 결과에 대해 평가 (현행 판정과 동일 — §10-S13)
 6. events.value = [정적 이벤트, ...최종 초기 이벤트] → aggregate → store 완성 (현행)
 7. (react 통합 등이) store.init() 호출 → onInit({ actions, initializedBy: "create" })
```

guard가 초기 진입을 전부 strip하면(overrideInitialEvents가 빈 배열 반환) 5에서
`onInitialActivityNotFound`가 발화하고 activity 0개 스택으로 생성된다 — "초기 activity 없음"은 오늘도
정의된 상태이며(§10-S3의 빈 배열 경로) 같은 상태에 착지한다. 이 판정은 `overrideInitialEvents`가
무변경이므로 현행과 동일하다(가로채기 파이프라인 신설이 없어 Ignored 의미 확장도 불필요하다).

### 4.2 load 경로 — 정확히 하나가 non-null

```
makeCoreStore(options)
 1. 플러그인 인스턴스화
 2. provideSnapshot 전원 폴링
    — non-null 0개 → create 경로(§4.1의 3부터)
    — non-null 2개 이상 → 생성 에러 throw (설정 오류, §3.3)
    — non-null 1개 → load 경로, 공급 플러그인 확정
 3. 구조 검사: $schema 일치·events 배열·항목이 탐색 이벤트 6종
    — 위반 → SnapshotLoadError{incompatible-schema} → 7로
 4. 등록 검사: 스냅샷의 activity 도입 이벤트(Pushed·Replaced) 전수의 activityName이
    정적 이벤트(ActivityRegistered)가 이루는 load 시점 등록 집합에 속하는지 검사
    — 위반 → SnapshotLoadError{invalid-events} → 7로
    — Pushed는 이후 재생의 validateEvents도 잡지만 Replaced는 여기서만 잡힌다(§10-S6a)
 5. 재기저(rebase): 스냅샷 이벤트의 eventDate를 아래 규칙으로 재부여 (그 외 필드 전부 보존)
 6. events.value = [정적 이벤트, ...재기저된 스냅샷 이벤트] → aggregate 재생
    — 정적 이벤트 = options.initialEvents 중 Pushed/StepPushed가 아닌 전부. 이 설계는 그것이
      Initialized·ActivityRegistered(현행 react 통합의 관행 — §10-S10)라고 전제한다. 다른 탐색
      이벤트(Popped 등)를 initialEvents에 직접 넣는 비관용 임베딩은 이 전제 밖이다
    — options의 초기 Pushed/StepPushed(예: initialActivity)는 폐기: 스냅샷이 곧 탐색 기록이며,
      "무엇으로 시작하는가"는 create 경로의 어휘다. 복원된 탐색 위에 initialActivity를 겹치면
      보존 시점에 없던 activity가 생겨 R11(충실한 재구성)을 깬다
    — overrideInitialEvents 체인 · initial activity 핸들러 전부 건너뜀:
      둘 다 "초기 진입을 무엇으로 정하는가"라는 create 어휘의 표면이고, load 진입은 가로채기
      대상이 아니다(R6). create 가로채기 소비자(guard)가 overrideInitialEvents에서 동작하므로,
      load 경로가 그 체인을 건너뛴다는 것이 곧 load 비가로채기다
    — validateEvents throw → SnapshotLoadError{invalid-events} → 7로
    — 재생 성공 후 사후조건 검사: enter 상태 activity ≥ 1 — 위반 → {empty-navigation} → 7로
 7. (실패 시) 공급 플러그인의 onLoadError({ error, initialContext })
    — { recover: "create" } 반환 → §4.1의 3부터 재개 (provideSnapshot 재폴링 없음)
    — void/핸들러 부재 → makeCoreStore 밖으로 throw
 8. (성공 시) store 완성
 9. store.init() → onInit({ actions, initializedBy: "load" })
```

**재기저 규칙** (4단계):

- **RB1 — 순서 보존**: 스냅샷 `events` 배열 순서대로 강한 단조 증가하는 eventDate를 부여한다.
  캡처가 배열 순서를 aggregate 전처리 순서로 정규화하므로(§3.2) 배열 순서가 곧 의미상 재생 순서다.
- **RB2 — 정착 보장**: 모든 재기저 date ≤ 생성 시각 − transitionDuration. Pushed 리듀서는
  `now − eventDate ≥ transitionDuration`이면 enter-done으로, Popped 리듀서는 동형으로 exit-done으로
  fold하므로(§10-S8) 재생 결과는 전원 정착 상태다. Replaced의 진입 activity 역시 같은
  isTransitionDone 규칙(기존 activity의 transitionState 계승 폴백 포함 — §10-S8)으로 enter-done에
  정착한다. Paused/Resumed가 스냅샷에 없으므로(§3.1) `globalTransitionState`는 idle로 착지한다. 이는 react 통합이 정적 이벤트에 쓰는
  `enoughPastTime`(= 생성 시각 − 2·transitionDuration, §10-S10)과 history-sync가 초기 이벤트에 쓰는
  과거 backdating(§10-S11)과 같은 기법의 정식화다.
- **RB3 — 정적 이벤트 선행(일반 경우)**: 정적 이벤트 date보다 뒤의 창
  (max(정적 date), 생성 시각 − transitionDuration] 안에 배치한다. eventDate는 JS number라 소수가
  허용되므로(현행 `time()`이 이미 소수 반환) 이벤트 개수와 무관하게 창 안에 채울 수 있다. 창이
  퇴화하는 경우(core를 직접 embedding하며 정적 이벤트를 생성 시각 부근으로 준 경우 등)에도 RB2만
  지키면 fold 의미론은 안전하다 — Pushed가 Initialized보다 먼저 fold되면 transitionDuration이
  기본값 0으로 평가되어 과거 date면 여전히 enter-done이고(§10-S8), 등록 검사는 배열 순서
  무관(§10-S6)이다. 동률 date는 안정 정렬로 입력 배열 순서가 보존된다(§10-S7).
- **RB4 — 신규 이벤트 후행**: load 후 디스패치되는 이벤트는 현재 시각으로 만들어지므로 RB2의
  상한보다 항상 뒤다 — 스냅샷 이벤트 뒤로 정렬된다. 재기저가 원본 date **값**이 아니라 캡처
  **순서** 기반이므로, 캡처 세션과 load 세션 사이의 시계역행(시계 조정·NTP·타임존)이 스냅샷 내부
  순서에 영향을 주지 않는다. 원본 date를 그대로 쓰는 대안은 캡처 세션 시계가 앞서 있던 경우 스냅샷
  이벤트가 미래 date가 되어 신규 이벤트가 그 **앞**으로 정렬되는 순서 붕괴와 enter-active 잔류를
  일으키므로 기각했다.
- **RB5 — id 보존**: 원본 이벤트 `id`·`activityId`·`stepId`는 바이트 보존한다. history-sync의
  popstate 방향 판정이 activity id 대소 비교에 의존하고(§10-S16), 현행 history-sync의
  history.state 복원이 이미 원본 이벤트를 id·activityId까지 보존해 재사용하는 선례가 있다(§10-S17).
  세션 간 시계역행 시 "신규 push의 id < 복원 activity id"가 될 수 있는 잔여 노출은 현행
  history.state 복원과 동일한 기존 노출이며 이 설계가 새로 만드는 것이 아니다.

### 4.3 기존 경로와의 관계

- 생성 중에는 어느 경로든 post-effect 훅(`onPushed`·`onChanged` 등)이 발화하지 않는다 — 초기
  집계는 `stack.value`에 직접 대입되며 effect 산출 경로를 타지 않는 현행 구조(§10-S2) 그대로다.
- `overrideInitialEvents`는 시그니처·호출 시점·의미 전부 무변경이다. 그 결과는 create 취급이며(R8),
  create 가로채기 소비자(guard)는 바로 이 `overrideInitialEvents` 체인 안에서 초기 이벤트를 검사·
  strip·치환한다(§3.5) — deep link(URL 해석)도 create이고 guard의 적용 대상이라는 `CONTEXT.md`
  정의와 정확히 맞물린다.
- `store.init()`/`onInit`의 호출 주체·타이밍(react 통합이 브라우저에서 1회 호출, §10-S13·S10)도
  무변경이다. load 경로에서도 같은 지점에서 발화하며 신호만 다르다.

---

## 5. 불변식

**경로 공통**

- **C1 (경로 배타)**: 한 번의 생성은 정확히 create 또는 load 하나를 탄다. load 실패 복구는 공급자의
  명시적 `{ recover: "create" }` 결정으로만 create에 재진입하며, 재진입 후 다시 load로 돌아올 수 없다
  (재폴링 없음).
- **C2 (자리 하나)**: non-null 공급 2개 이상 = 생성 에러. core는 조정하지 않는다 — 조정자가 아니라
  강제자다(R9).
- **C3 (신호 일회성)**: `initializedBy`는 생성 시점 훅 인자로만 존재하고 Stack 상태·이벤트 로그 어디에도
  남지 않는다(R7).
- **C4 (생성 중 무발화)**: 생성 완료 전에는 어떤 post-effect 훅도 발화하지 않는다(§10-S2).

**create 경로**

- **N1 (현행 동일성)**: 스냅샷 공급자가 없으면(`provideSnapshot` 전원 null) create 시퀀스는 오늘의
  코드 경로와 관찰상 동일하다. create 경로에 신규 step이 없고 `overrideInitialEvents`가 무변경이므로,
  guard 등 create 가로채기 소비자의 설치 여부와 무관하게 성립한다(R8의 구조적 근거 — §6 R8).
- **N2 (핸들러 보존)**: initial activity 핸들러(ignored/notFound)는 `overrideInitialEvents` 체인
  결과에 대해 현행과 같은 판정으로 발화한다(§10-S13).

**load 경로**

- **L1 (무가로채기)**: `overrideInitialEvents` 체인이 호출되지 않는다(R6) — load 분기가 초기 이벤트
  파이프라인 자체를 건너뛰므로 규약이 아니라 구조의 귀결이다. 그 체인에서 create 진입을 가로채는
  guard도 load 경로에서는 구조적으로 작동하지 않는다.
- **L2 (도달 가능성 — by construction)**: 재생 결과는 "현행 core가 이 이벤트 열을 처리했다면
  도달했을 상태" 그 자체다 — 기존 `aggregate`+`validateEvents`를 무변경 통과했으므로 R11의
  도달 가능성이 구성적으로 보장된다. config 진실(등록)은 L6이 봉인한다.
- **L3 (사후조건)**: enter 상태(enter-done) activity ≥ 1이고 `globalTransitionState === "idle"`이며,
  탐색 기록(활성 activity 열·순서·steps·params·`enteredBy`·현재 위치)이 스냅샷 재생 결과와
  일치한다. enter activity 0개는 `empty-navigation` 에러다.
- **L4 (재기저 규칙)**: RB1–RB5(§4.2). 특히 원본 id 보존과 신규 이벤트 후행 정렬.
- **L5 (왕복 안정)**: load 직후 `captureSnapshot()`은 같은 탐색 기록을 재구성하는 스냅샷을 반환한다
  — 캡처∘load∘캡처가 재생 결과 기준으로 안정이다(재기저·압축은 `events` 내용을 바꿀 수 있으나
  재생 결과는 보존).
- **L6 (등록 봉인)**: 재생에 도달하는 스냅샷의 모든 activity 도입 이벤트(Pushed·Replaced)의
  `activityName`은 load 시점 등록 집합에 속한다 — 위반은 `invalid-events`로 시끄럽게 실패한다.
  낡은 config의 activity가 어떤 이벤트 종류를 통해서도 조용히 살아나는 경로가 없다(R4·R11의
  config 진실).

---

## 6. 요구사항 충족 논증 (R1–R13·비목표)

| 요구 | 충족 방식 |
|---|---|
| R1 소스 불문 | 진입은 `provideSnapshot` 하나 — storage든 history.state든 인메모리든 같은 훅으로 공급 |
| R2 이진 분류 | 경로 = 스냅샷 존재 여부로 이분. core 어휘는 `initializedBy: "create" \| "load"`뿐. deep link는 create의 내부 사정(`overrideInitialEvents`)으로 남음 |
| R3 동기 load | `provideSnapshot`은 생성 중 동기 호출·동기 반환. 비동기 소스는 생성 지연(상위 부트스트랩) + 인라인 공급 플러그인. 에러 복구 결정(`onLoadError`)도 동기 |
| R4 명시적 에러 | `SnapshotLoadError` 3분류 + 기본 throw. 폴백은 공급자의 명시적 `{ recover: "create" }`로만. `empty-navigation`도 에러로 승격. 미등록 activity 물화(Pushed·Replaced 불문)는 load 등록 검사가 잡음(L6) |
| R5 공급자 1차 처리 | `onLoadError`는 스냅샷을 공급한 플러그인에게만 호출. 앱 개발자는 잘 만든 공급자 뒤에서 무관여 |
| R6 create 가로채기·load 비대상 | create 진입 가로채기 = `overrideInitialEvents` 체인의 검사·strip·치환(§3.5), load 경로는 그 체인을 구조적으로 건너뜀(L1) |
| R7 일회성 신호 | `initializedBy`는 `onInit` 인자로만 존재, Stack·이벤트 로그 무흔적(C3). 재생 activity의 `enteredBy`도 원본 이벤트 |
| R8 non-breaking | 아래 상세 논증 |
| R9 단일 자리 | non-null 2개 이상 = 생성 에러(C2). 선언적 폴링으로 순서 무관 강제 |
| R10 왕복 폐쇄 | `captureSnapshot()` → plain-data `StackSnapshot` → `provideSnapshot` — 셋 다 core 계약. 외부 지식 불요(§7.1의 설계 수준 증명) |
| R11 충실 재구성 | 재생 = 현행 aggregate 통과 → 도달 가능성 구성적 보장(L2) + 등록 봉인(L6) + 사후조건 봉인(L3). 충실성의 필수 범위(탐색 기록)는 이벤트 바이트 보존으로 성립 |
| R12 탐색 기록 필수·나머지 부가 | 스냅샷 = 탐색 이벤트만. transitionDuration·registeredActivities는 load 시 현행 config에서 재파생. Paused·전환 진행은 폐기(재기저로 전부 정착·idle 착지). exit-done activity도 이벤트 이력이므로 재생으로 재구성되어(§10-S9) "무엇을 봤었고"까지 보존 |
| R13 codec 소비자 책임 | 스냅샷은 plain-data 값, core는 인코딩 무관여. loader data 제거·재파생 패턴은 이벤트 `activityContext` 변환으로 성립(§7.1.3) |

**R8 상세 — non-breaking이 확률이 아니라 구조로 성립하는 이유**

1. **신규 표면은 전부 additive다**: 옵셔널 훅 2개(`provideSnapshot`·`onLoadError`) + actions
   메서드 1개 + `onInit` 인자 필드 1개 + 타입 2개. 기존 시그니처 변경 0, 기존 훅 제거 0,
   `makeCoreStore` 옵션 변경 0, `aggregate`/`validateEvents`/리듀서 변경 0, `overrideInitialEvents`
   변경 0.
2. **스냅샷 미공급 시 코드 경로가 오늘과 동일하다(N1)**: 공급자가 없으면 폴링은 전부 null이고
   create 경로엔 신규 step이 없다. 기존 플러그인의 어떤 훅도 새로운 시점에 불리지 않고, 불리던 훅이
   안 불리게 되지도 않는다. `overrideInitialEvents`는 무변경 유지되고 그 결과는 create 취급된다 —
   현행 history-sync는 한 줄도 안 바꾸고 오늘처럼 동작한다(§7.3 국면 1).
3. **onInit 인자 추가의 안전성**: 현행 `onInit`은 `{ actions }` 단일 인자 객체로 발화하며(§10-S13),
   레포 내 사용자 6개는 인자를 무시하거나(GA4는 무인자 `onInit()` 선언) `actions`만 구조분해한다.
   필드 추가는 관찰 불가능하다.
4. **load 경로는 opt-in으로만 도달 가능하다**: load는 `provideSnapshot`을 구현한 신규 API 플러그인을
   설치해야만 발생한다. 기존 앱은 정의상 이 플러그인이 없으므로 새 분기에 진입할 수 없다.
5. **create 진입을 액션 파이프라인에 태우지 않는 것 자체가 R8 장치다**: §3.5의 비통일 논증 —
   post-effect 발화(history-sync `pushState` 중복)와 pre-effect 오발화(loader plugin의 생성 중
   `pause()`)를 구조적으로 차단한다. create 가로채기를 `overrideInitialEvents`(pre-aggregate 데이터
   변형)에 두는 것이 이 차단의 위치다.

**비목표 정합**: late load 없음(생성 시점 전용, 재폴링 없음) / create 세분화 없음(deep link는 core
어휘 밖) / 지속 속성 없음(C3) / react 앱 개발자 신규 표면 없음(전부 플러그인 계약) / 버전
마이그레이션 없음(`$schema` 불일치 = `incompatible-schema` 에러).

---

## 7. 소비자 성립 논증

### 7.1 persister (FEP-2546) — 캡처→보존→load 왕복의 설계 수준 증명

완료 기준: **"persister를 흉내낸 테스트 플러그인이 core API만으로 load 경로를 탈 수 있다."**
§2.1의 플러그인이 그 테스트 플러그인이다. 왕복의 각 단계가 계약 표면에 닫혀 있음을 잇는다:

1. **캡처**: 임의 훅(예: `onChanged`)에서 `actions.captureSnapshot()` — actions는 모든 훅에
   전달되는 기존 표면. 반환값은 plain-data `StackSnapshot`(§3.2).
2. **보존**: `codec.encode(snapshot)` → storage. codec·storage는 공급자 소유(R13) — core 계약 밖이되
   계약이 요구하는 유일한 성질(plain-data)을 §3.1이 보장.
3. **load**: 다음 생성에서 core가 `provideSnapshot({ initialContext })`을 동기 폴링(§4.2-2) —
   공급자는 storage를 동기로 읽어 `codec.decode` 후 반환. null이면 create.
4. **재구성**: core가 구조·등록 검사→재기저→재생→사후조건(§4.2-3~6). 성공 시 `onInit({ initializedBy: "load" })`.
   결과 스택의 탐색 기록은 캡처 시점과 일치(L3)하고, 이후 항해는 오늘과 동일한 액션 경로.
5. **실패 처리**: 손상 스냅샷이면 core가 이 공급자의 `onLoadError`만 호출(§3.4) — 공급자는 스냅샷을
   폐기하고 `{ recover: "create" }` 반환 → 앱은 초기 화면으로 정상 기동. 앱 개발자 코드는 어디에도
   등장하지 않는다(R5).
6. **왕복 재개**: load 직후 `captureSnapshot()`이 같은 탐색 기록을 재구성하는 스냅샷을 반환(L5)하므로
   주기적 persist가 자연스럽다.

1–6에 등장한 표면은 `captureSnapshot`·`StackSnapshot`·`provideSnapshot`·`onLoadError`·`onInit(initializedBy)`
— 전부 core 계약이다. 외부 지식(react 내부·다른 플러그인)이 필요한 단계가 없다(R10). ∎

**7.1.3 loader data 재파생 패턴 (R13 참고 시나리오)**: 재파생 가능한 런타임 데이터는 스냅샷에 담지
않고 load 후 재파생한다. 이 계약에서의 성립: 스냅샷이 투명한 plain-data이므로 공급자(또는 loader와
협조하는 상위 계층)는 ① 보존 시 이벤트의 `activityContext`에서 loader data를 제거하고(대개 codec
직렬화가 자연히 떨어뜨림) ② `provideSnapshot` 반환 직전에 각 Pushed 이벤트에 대해 loader를 재실행해
promise를 `activityContext`에 재주입할 수 있다. promise **생성**은 동기이므로(현행 loader plugin의
동기 resolve 래핑과 동일 기법, §10-S15) R3(동기 load)과 충돌하지 않는다.

### 7.2 activity guard (FEP-2521) — create 가로채기·load 스킵

- **런타임 push**: 기존 `onBeforePush`(현행 파이프라인, §10-S5) — 무변경.
- **create 최초 진입**: `overrideInitialEvents` 체인에서 초기 이벤트 배열을 검사·strip(차단)·
  치환(리다이렉트)한다(§2.2·§3.5). deep link든 initialActivity든, 집계에 도달하는 모든 초기 Pushed가
  이 체인을 지난다. guard가 배열 전체를 한 번에 보므로 배치 정책("하나라도 차단이면 전체를 로그인
  스택으로 치환")이 자명하게 표현되고, guard가 loaderPlugin(자동 마지막 배치 — §10-S23)보다 앞에서
  strip하면 차단될 activity의 loader가 아예 실행되지 않는 부수 이득도 있다.
- **성립 조건 ① 순서 규율**: history-sync의 `overrideInitialEvents`는 들어온 `initialEvents`를 받지
  않고 자기 배열을 새로 만든다(§10-S22). 따라서 guard가 history-sync보다 **앞**에 있으면 guard의
  출력이 통째로 버려져 인증 가드가 침묵으로 우회된다. guard는 초기 이벤트 생성자(history-sync 등)보다
  **뒤**에 배치해야 한다 — 이 생태계가 이미 쓰는 순서 규율과 동종이다(loaderPlugin은 history-sync
  뒤에 와야 하고 react 통합이 이를 코드로 강제 — §10-S23).
- **성립 조건 ② 검증 벨트**: 순서 오배치의 침묵성을 개발 시점의 큰 소리로 전환하는 안전망으로,
  guard는 `onInit`(`initializedBy === "create"`)에서 최종 스택을 정책과 대조해 위반 시 throw한다
  (§2.2 코드). 이 시점은 **집행이 아니라 검증**이다: 사후 pop은 SSR에 이미 실린 마크업을 되돌리지
  못하고(§10-S10 브라우저 전용 `store.init`), Popped·exit-done 잔존·post-effect 발화라는 흔적을
  남기며(§10-S9), 스택 중간 activity는 churn 없이 제거할 수 없다(§3.5). 그러나 검증에는 정확히 맞다 —
  스택이 완성됐고 `initializedBy`로 경로를 구분할 수 있으며, 위반의 유일한 원인이 "guard가 초기
  이벤트를 못 봤다"(순서 오배치)이므로 설정 오류로 크게 실패시키면 된다. 벨트는 guard 플러그인 저자가
  한 번 구현하는 패턴이지 앱 개발자 표면이 아니다.
- **load 스킵**: guard에 스킵 코드가 없다 — load 경로는 `overrideInitialEvents` 체인 자체를
  건너뛰므로(L1) 구조적으로 불리지 않는다. `onInit` 벨트도 `initializedBy === "load"`면 즉시 반환한다
  (load는 보존 시점에 이미 검증된 맥락 — R6·`CONTEXT.md`). "이미 검증된 맥락의 재구성은 가로채지
  않는다"가 정책 코드가 아니라 경로 구조로 성립한다.
- **엣지**: guard가 초기 진입을 전부 strip하면 `onInitialActivityNotFound` + 빈 스택 — 현행 "초기
  activity 없음"과 같은 정의된 상태(§4.1). strip 대신 대체 진입은 배열 치환으로, 진입 후 리다이렉트는
  `onInit` 이후에 한다(§3.5).

### 7.3 history-sync (FEP-2001) — 스택을 진실의 원천으로

세 국면으로 성립을 논증한다. **core 계약은 세 국면에서 동일하다 — 개정되는 것은 플러그인뿐이다.**

- **국면 1 — 현행 (이 설계 배포 직후, history-sync 미개정)**: 공급자가 없으므로 모든 생성이 create
  경로다. history-sync의 `overrideInitialEvents`(history.state/URL 해석)·`onInit`(히스토리 정렬)·
  `onPushed`(pushState) 전부 오늘과 동일하게 발화한다(R8). `overrideInitialEvents`가 만든 초기
  이벤트는 create 취급이므로, guard가 (history-sync 뒤에 — §7.2 순서 규율) 설치되면 같은
  `overrideInitialEvents` 체인에서 가로채기 대상이다 — deep link는 create라는 어휘 정의
  (R2·`CONTEXT.md`)와 일치.
- **국면 2 — 과도 (persister 도입, history-sync 미개정)**: persister가 유일 공급자로 load. 이때
  history-sync의 `overrideInitialEvents`는 발화하지 않는다(L1) — 이것은 새 의미론이지만 opt-in
  사용자에게만 나타난다. `onInit`은 발화한다: `history.location.state`가 비어 있으면(콜드 스타트)
  현행 로직이 복원된 스택 전체를 브라우저 히스토리에 정렬한다(§10-S18) — 이미 올바른 방향이다.
  state가 있으면(리로드) 정렬을 건너뛰는데, 원본 activity id 보존(RB5) 덕에 같은 세션의 state와는
  id가 일치해 popstate 방향 판정이 동작하나, 스냅샷과 브라우저 히스토리가 어긋난 경우의 정합은
  미보장이다 — **이 간극을 닫는 것이 FEP-2001의 범위**이며, 그때까지 persister 문서가 이 조합의
  한계를 명시해야 한다.
- **국면 3 — 목표 (FEP-2001 개정 후)**: history-sync 자신이 공급자가 된다 — `provideSnapshot`으로
  history.state에서 스냅샷을 공급하고(§2.3), `onInit`에서 `initializedBy === "load"`를 받아 "loaded
  스택 → 브라우저 히스토리 동기화"를 수행한다. 스택이 진실의 원천이 되는 개정의 신호·진입점·충실성
  (id·`enteredBy` 보존)이 이 계약으로 전부 공급된다. persister×history-sync 동시 공급은 R9 생성
  에러로 조기 가시화되며, 조정(예: history.state 존재 시 persister 양보)은 core 위 계층
  (FEP-2546×FEP-2001)의 설계 숙제다 — core는 이 숙제를 없애 주지 않고 에러로 드러낸다.

---

## 8. 스냅샷 형식의 결정 근거와 기각 대안

**채택 — 탐색 이벤트 이력 (정적 이벤트는 load 시 재파생)**

현행 런타임은 매 dispatch·매 전환 프레임마다 이벤트 전체를 재집계한다(§10-S1). 이벤트 로그가
런타임 모델의 1급 시민이므로, 스냅샷을 이벤트 이력으로 두면:

- load 재구성이 기존 재생 기계(`aggregate`·리듀서·`validateEvents`)의 무변경 재사용이 된다 —
  R11의 가장 비싼 증명 의무(도달 가능성)가 구성적으로 무료다. 추가되는 검증은 load 등록 검사
  하나뿐이며(§3.4·L6), 이는 새 술어가 아니라 `validateEvents`가 Pushed에 쓰는 기존 등록 술어를
  activity 도입 이벤트 전수(Pushed·Replaced)로 확장 적용한 것이다 — 상태를 물화·검증하는 병렬
  검증기가 아니라 이벤트 필드 하나의 멤버십 검사다.
- `enteredBy`가 원본 이벤트로 바이트 보존된다(§10-S9) — history-sync의 popstate·isRoot 판정
  의존(§10-S16)이 무변조로 유지된다. exit-done activity도 재생으로 재구성된다.
- load 직후 이벤트 로그가 차 있으므로 이후 dispatch·재캡처가 오늘의 런타임 모델 그대로 동작한다.

**기각 대안**

- **집계 상태(`Stack`) 스냅샷**: 상태를 주입하면 직후 이벤트 로그가 비어 "전체 재집계" 런타임
  모델이 성립하지 않는다 — 상태→이벤트 역합성 또는 증분 리듀서 재설계가 필요하고, `aggregate`
  시그니처(현행: 하드코딩된 빈 시드, §10-S7) 변경과 R11용 도달 가능성 검증기 신설(validateEvents는
  이벤트만 검사)까지 지불한다. 비파괴 메커니즘의 지불 초과.
- **전체 이벤트 로그(정적 이벤트 포함)**: 보존 시점의 Initialized·ActivityRegistered가 load 시점
  현행 config를 가린다(낡은 transitionDuration·사라진 activity의 등록 정보로 스택이 살아남 — R4
  위반 방향). Initialized 2개는 `validateEvents` 위반이기도 하다(§10-S6). 크기 문제도 가중.
- **중립 제3 포맷(activity 배열 등) 신설**: 이벤트와 스택 사이의 세 번째 표현을 만들어 변환기
  2개(포맷→이벤트/상태, 캡처→포맷)를 유지보수하게 된다. 이벤트 어휘 결합(아래 트레이드오프)을
  피하지 못하면서 표면만 는다.

---

## 9. 크기 성장과 compaction 로드맵 (v1 미포함 — 계약 무변경 내부 진화)

이벤트 이력 스냅샷의 실재 지불은 **세션 길이에 비례한 성장**이다(이벤트 로그는 누적만 된다,
§10-S1a). 대응:

- **v1은 compaction을 포함하지 않는다.** 장수 세션의 실측 크기 문제가 실증되기 전의 선제 최적화이며,
  축약 기준은 정보가 늘었을 때 더 잘 결정된다.
- **계약은 이미 축약을 허용한다**: §3.1이 명문화한 대로 소비자는 `events`의 구체 내용이 아니라
  재생 결과에만 의존해야 한다. 따라서 캡처가 "미래 항해와 재생 결과에 영향을 주지 않는 이벤트
  그룹"(대표: 완전히 exit된 activity의 이벤트 그룹 — 단 exit 이력 재구성의 충실성 요구 수준을
  R12 필수 범위 판단과 함께 결정)을 접는 것은 `$schema` 유지·소비자 코드 무변경의 내부 진화다.
- **구현 대안 2개**: ① 캡처 시 이벤트 그룹 접기(로그 필터형) ② 살아있는 activity 중심의 프로젝션으로
  저장하되 캡처 시점에 표준 탐색 이벤트로 합성(합성형). 합성형을 택할 경우 **`enteredBy` 원본 이벤트를
  보존해야 한다** — generic Pushed로 합성하면 Replaced로 진입했던 activity의 진입 이력이 소실되어
  history-sync 충실성(§10-S16·S17)이 깨진다. 이것이 합성형의 필수 교정 조건이다.

---

## 10. 전제하는 현행 소스 사실 (전부 이 설계 작성 시점에 재검증)

| # | 사실 | 위치 |
|---|---|---|
| S1 | 스택 상태는 이벤트 전체의 재집계로만 산출 — 생성 시 `aggregate(events.value, now)`, dispatch마다 `aggregate([...events, new], …)`, 전환 중 매 프레임 재집계 | `core/src/makeCoreStore.ts:83-85, 96-99, 108-121` |
| S1a | 이벤트 로그는 누적만 되고 소거되지 않음(`events.value.push`), `pullEvents()`로 노출 | `core/src/makeCoreStore.ts:101, 159` |
| S2 | 초기 집계는 `stack.value` 직접 대입 — `setStackValue`(→`produceEffects`→post-effect 훅)는 dispatch에서만 호출되므로 생성 중 post-effect 훅 무발화 | `core/src/makeCoreStore.ts:83-85` vs `:102, 134-138` |
| S3 | `overrideInitialEvents`는 Pushed/StepPushed만 분리해 플러그인 배열 순서로 reduce하는 동기 체인. preventDefault 시맨틱 없음(대체 배열 반환만). 빈 결과 → `onInitialActivityNotFound`, 참조 변경 → `onInitialActivityIgnored` | `core/src/makeCoreStore.ts:52-77`, `core/src/interfaces/StackflowPlugin.ts:133-136` |
| S4 | 초기 이벤트는 액션 파이프라인을 타지 않고 직접 집계 — 현행 create 진입은 onBeforePush 비대상 | `core/src/makeCoreStore.ts:79-85` |
| S5 | 액션 경로: pre-effect 훅(preventDefault/overrideActionParams) → dispatch → 집계 → post-effect 훅 | `core/src/utils/makeActions.ts:16-29`, `core/src/utils/triggerPreEffectHooks.ts:32-68`, `core/src/makeCoreStore.ts:93-123, 134-138` |
| S6 | `validateEvents`는 ①비어있지 않음 ②Initialized ≤ 1개 ③모든 Pushed.activityName 등록 존재 — 세 가지만, 배열 순서 무관. **Replaced는 검사 대상이 아니다**(Pushed만 필터) | `core/src/event-utils/validateEvents.ts:4-26` (Pushed 필터: `:21-24`) |
| S6a | `ReplacedEvent`도 `activityName`을 보유하고, 리듀서는 Replaced로부터 activity를 물화한다 — 미등록 activity의 Replaced가 현행 `validateEvents`를 침묵 통과한다(런타임 `replace()`도 동일한 현행 간극) | `core/src/event-types/ReplacedEvent.ts:3-13`, `core/src/activity-utils/makeActivitiesReducer.ts:48-65`, `core/src/activity-utils/findNewActivityIndex.ts:9-16`, `core/src/activity-utils/makeActivityFromEvent.ts:8-27` |
| S7 | `aggregate`는 eventDate 오름차순 정렬(안정 정렬 — 동률은 입력 순서) + id 중복 제거 후, 하드코딩된 빈 스택 시드로 reduce | `core/src/aggregate.ts:11-31` |
| S8 | Pushed 리듀서: `skipEnterActiveState \|\| now − eventDate ≥ transitionDuration`이면 enter-done. Popped 리듀서 동형으로 exit-done. Replaced 진입 activity는 기존 activity의 transitionState 계승 또는 동일 isTransitionDone 폴백. transitionDuration은 fold 시점 스택 값(Initialized 전이면 0) | `core/src/activity-utils/makeActivitiesReducer.ts:27-43, 48-66`, `core/src/activity-utils/makeActivityReducer.ts:38-61`, `core/src/activity-utils/makeStackReducer.ts:87-97` |
| S9 | activity의 `enteredBy`는 진입 이벤트 객체 그대로, `exitedBy`도 동일. exit-done activity는 `stack.activities`에 잔존(visibleActivities에서만 제외, zIndex=-1) | `core/src/activity-utils/makeActivityFromEvent.ts:8-27`, `core/src/Stack.ts:36-37`, `core/src/aggregate.ts:36-41, 53-57` |
| S10 | react 통합: 정적 이벤트(Initialized·ActivityRegistered)를 config에서 `enoughPastTime()`(= now − 2·transitionDuration)으로 생성, initialActivity Pushed도 동일, 브라우저에서 `store.init()` 1회 호출 | `integrations/react/src/stackflow.tsx:90-107, 135-145, 178-181` |
| S11 | 현행 history-sync: URL 해석 초기 이벤트에 `now − (length − index)` 과거 backdating + 첫 Pushed에 `skipEnterActiveState` | `extensions/plugin-history-sync/src/historySyncPlugin.tsx:429-447` |
| S12 | 현행 history-sync `onPushed`는 (플래그 미설정 시) push마다 `pushState` 호출 | `extensions/plugin-history-sync/src/historySyncPlugin.tsx:634-657` |
| S13 | `onInit`은 `store.init()`(once)에서 `{ actions }` 단일 인자로 1회 발화 | `core/src/makeCoreStore.ts:150-158` |
| S14 | pause 중 디스패치된 이벤트도 `events.value`에는 무조건 누적(pausedEvents 큐잉은 리듀서 내부 사정) | `core/src/makeCoreStore.ts:101`, `core/src/activity-utils/makeStackReducer.ts:14-29` |
| S15 | loader plugin: `overrideInitialEvents`로 loaderData를 `activityContext`에 동기 주입(resolve 래핑), `onBeforePush`는 pending 시 `pause()` 호출 | `integrations/react/src/loader/loaderPlugin.tsx:31-80, 81-82, 100-140` |
| S16 | history-sync popstate 방향 판정은 activity id 문자열 대소 비교. id는 시각 기반 hex(세션 내 단조). isRoot의 Replaced 절은 `zIndex===1 && enter-active` 동시 성립 시에만 | `extensions/plugin-history-sync/src/historySyncPlugin.tsx:539-541`, `core/src/utils/id.ts`, `core/src/utils/time.ts`, `core/src/aggregate.ts:92-96` |
| S17 | 현행 history-sync는 history.state 존재 시 원본 이벤트를 스프레드로 재사용(id·activityId·eventDate 보존) — "원본 id 보존 복원"의 현행 선례 | `extensions/plugin-history-sync/src/historySyncPlugin.tsx:252-270` |
| S18 | 현행 history-sync `onInit`: history.state가 비어 있으면 enter 상태 activity들을 브라우저 히스토리에 replaceState/pushState로 정렬 | `extensions/plugin-history-sync/src/historySyncPlugin.tsx:449-503` |
| S19 | `makeEvent`는 `{ id: id(), eventDate: time(), ...parameters, name }` — 파라미터로 id·eventDate 덮어쓰기 가능(재생 시 원본 id·재기저 date 주입이 기존 표면으로 가능) | `core/src/event-utils/makeEvent.ts:13-18` |
| S20 | 레포 내 `overrideInitialEvents` 사용자는 history-sync·loader plugin 둘. `onInit` 사용자는 blocker·devtools·GA4·history-sync·lifecycle·stack-depth-change 6개 — 인자를 무시하거나(GA4는 무인자 `onInit()` 선언, `googleAnalyticsPlugin.tsx:35`) `actions`만 구조분해 | `extensions/*/src`, `integrations/react/src` (grep 검증) |
| S21 | `StepPushed`·`StepReplaced`는 `findLatestActiveActivity`(최신 활성 activity, eventDate 최대)를 타깃한다 — 평탄 초기 배열에서 StepPushed는 직전 Pushed가 만든 activity에 붙는다. 그 Pushed를 빼면 StepPushed는 다른 activity로 오귀속된다 | `core/src/activity-utils/findTargetActivityIndices.ts:78-91` |
| S22 | 현행 history-sync `overrideInitialEvents`는 들어온 `initialEvents`를 **받지 않고**(`{ initialContext }`만 구조분해) `history.location.state`/URL 해석으로 배열을 새로 만든다 — 이 체인 앞의 플러그인이 만든 초기 이벤트 출력은 history-sync가 덮어쓴다 | `extensions/plugin-history-sync/src/historySyncPlugin.tsx:252` |
| S23 | react 통합은 loaderPlugin을 플러그인 배열 **맨 뒤에 append**하며, 소스 주석이 "`loaderPlugin()` must be placed after `historySyncPlugin()`"로 순서 규율을 못박는다 — 플러그인 순서를 코드로 강제하는 기존 생태계 규율 | `integrations/react/src/stackflow.tsx:79-88` |

---

## 11. 트레이드오프

**지불하는 것**

- `makeCoreStore` 생성부의 분기 증가(폴링 → load 시도 → 실패 복구 → create 재개). 생성 시퀀스의
  상태도가 오늘의 직선 코드보다 하나 늘어난다.
- **스냅샷-이벤트 어휘 결합**: 스냅샷 호환성이 core 이벤트 스키마의 안정성에 묶인다. 이벤트 필드가
  비호환으로 바뀌면 옛 스냅샷은 load 실패한다. "비호환 = load 실패"가 비목표로 승인돼 있어 계약
  위반은 아니지만, 이벤트 스키마 변경의 비용을 키운다는 사실은 남는다 — `$schema` 태그가 그 비용을
  조용한 오동작이 아니라 명시적 에러로 바꾼다.
- guard는 두 어댑터를 유지한다 — 런타임(`onBeforePush`+preventDefault)과 create(`overrideInitialEvents`
  배열 필터/치환)의 모양이 달라 정책 함수를 두 어댑터에 물린다. 여기에 순서 규율(guard를 초기 이벤트
  생성자 뒤 배치)과 검증 벨트(`onInit`) 구현이 더해진다. 이 이원화·규율·벨트의 지불 주체는 guard
  플러그인 저자이지 앱 개발자가 아니며, 전용 create 훅을 두지 않은 대가다 — 그 대신 공개 표면이 하나
  줄고, breaking 없이 후에 전용 훅을 additive로 증분할 옵션이 보존된다(전용 훅은 순서 규율·벨트 없이
  구조적 집행을 보장했을 것이나, 지금 지불할 표면이 아니다 — §3.5).
- load 등록 검사 1건 — 등록 술어가 두 곳(런타임 `validateEvents`의 Pushed 검사, load의
  activity 도입 이벤트 전수 검사)에서 적용된다. 술어 자체는 동형이지만 규칙 변경 시 함께 고칠
  지점이 둘이 되는 소폭의 긴장. 런타임 `validateEvents`의 전역 확장(독립적 core 수정 후보 —
  §3.4)이 채택되면 한 곳으로 합쳐진다.
- 이벤트 이력은 세션 길이에 비례해 자란다 — compaction 로드맵(§9)으로 계약 무변경 완화가 예약되어
  있으나 v1에서는 장수 세션의 스냅샷이 비대해질 수 있다.

**획득하는 것**

- **표면 최소**: 신규 개념은 타입 2(스냅샷·에러) + actions 메서드 1 + 옵셔널 훅 2 + 기존 훅 인자 1.
  신규 도메인 이벤트 0, 신규 Stack 속성 0, react 표면 0, create 전용 가로채기 훅 0,
  `aggregate`/리듀서/`validateEvents`/`overrideInitialEvents` 변경 0.
- **R8이 확률이 아니라 구조로 보장**(§6 R8): 스냅샷 없음 → 기존 코드 경로 그대로. 기존 플러그인의
  어떤 훅도 새로운 시점에 불리지 않는다.
- **R11의 도달 가능성이 공짜**: 재생이 기존 집계·검증 기계를 재사용하므로 도달 가능성 증명이
  구성적. load에 추가되는 검증은 기존 등록 술어의 적용 범위 확장(Pushed → activity 도입 이벤트
  전수) 1건뿐 — 새 술어도, 상태를 물화·검증하는 병렬 검증기도 없다.
- **소비자 3인 즉시 성립**(§7): persister 왕복은 core API로 닫히고(완료 기준 충족), guard는 기존
  `overrideInitialEvents`의 strip/치환 + 순서 규율 + `onInit` 검증 벨트로 성립하며, history-sync는
  신호 분기 하나로 개정 경로가 열린다.
- **왕복 안정(L5)**: load 직후 재캡처가 안정적이라 주기적 persist가 자연스럽다.

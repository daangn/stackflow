# blockerPlugin 기술 스펙

## 1. 배경

모바일 웹뷰 기반 서비스 팀들(중고차, 부동산, UGC, 알바)이 공통적으로 "화면 이탈 방지 UX"를 구현하고 있다. 대표적으로 글쓰기 퍼널에서 뒤로가기를 누르면 "정말 나가시겠습니까?" 다이얼로그를 띄우는 패턴이다.

각 팀은 이를 독자적으로 해결했다:

| 서비스 | 훅 | 방식 |
| --- | --- | --- |
| car-client | `useBlockHistoryBack` + `useBlockLeave` | `history.block()` + 안드로이드 브릿지 |
| realty-client | `useBlockAndroidBack` + `useBlockLeave` | 안드로이드 브릿지 + `preventSwipeBack` + AppBar onClick |
| local-business-ugc | `useBlockNavigation` | `history.block()` + 안드로이드 브릿지 + iOS 브릿지 |
| jobs-client | (없음) | 라우트 설정 플래그 + 페이지별 ad-hoc 다이얼로그 |

모두 **Stackflow 바깥**(브라우저 히스토리 API, 네이티브 브릿지)에서 백버튼 이벤트를 가로채는 방식이다. 이로 인해:

1. **`connectBackButtonsPlugin` 도입 시 충돌.** 이 플러그인이 백버튼 이벤트 흐름을 변경하여 기존 `history.block()` 기반 코드와 충돌한다. 중고차 팀에서 이중 pop 문제가 발생, `useBlockLeave`가 비활성화된 상태.
2. **동일 문제를 4개 팀이 중복으로 해결.** 각각 미묘하게 다른 버그와 edge case를 안고 있다.
3. **백버튼 소스별 별도 처리.** 안드로이드 하드웨어 백, iOS 스와이프, 브라우저 히스토리, UI 백버튼 — 각각 다른 API로 제어해야 하며, 통합이 각 서비스의 책임이 되어 있다.

## 2. 문제 정의

**화면 이탈 제어라는 네비게이션 관심사가 Stackflow 바깥에서 서술되고 처리되고 있다.**

Stackflow 코어에는 `onBefore*` + `preventDefault()` 메커니즘이 존재하지만, 이는 전역 플러그인 API이다. 개별 액티비티가 "나로부터의 이탈을 막아줘"라고 선언할 수 있는 인터페이스가 없다. 이탈 차단 여부는 대부분 UI 상태(폼 dirty 여부, 업로드 진행 중 등)에 의존하는데, 전역 플러그인에서 컴포넌트 상태에 접근하려면 외부 상태 저장소 연동 등 세레모니가 필요하다.

## 3. 설계 방향

### 설계 가치

```
D. 모든 이벤트 소스가 하나의 인터셉트 지점으로 합류     ← 기반
B. 그 인터셉트 지점은 Stackflow 내부에 있음              ← 소유권
C. Stackflow는 최소한의 프리미티브로 이를 제공            ← API 철학
A. 액티비티가 그 프리미티브를 사용해 자기 정책을 선언      ← 사용 패턴
```

### 설계 결정

- **코어 변경 없음.** `onBefore*` + `preventDefault()`는 이미 충분한 capability를 제공한다. 부족한 것은 capability가 아니라 액티비티 컴포넌트에서의 접근 ergonomics이다.
- **`StackflowReactPlugin`으로 구현.** 코어 플러그인 훅(`onBeforePush`, `onBeforePop`, `onBeforeReplace`, `onBeforeStepPush`, `onBeforeStepPop`, `onBeforeStepReplace`)과 React 레이어를 결합하는 기존 패턴을 따른다.
- **Callback 기반 인터페이스.** 차단을 `onBlocked` 콜백으로 통보하고, 이후 UX 흐름은 개발자가 자유롭게 구현한다.
- **모든 네비게이션 이벤트 차단 가능.** pop뿐 아니라 push, replace, step 계열까지 `shouldBlock` predicate로 선택적 차단이 가능하다.

## 4. Public API

### `blockerPlugin`

```tsx
import type { StackflowReactPlugin } from "@stackflow/react"

declare function blockerPlugin(): StackflowReactPlugin
```

```tsx
stackflow({
  plugins: [
    blockerPlugin(),
    // ...
  ],
})
```

### `useBlocker`

```tsx
type NavigationAction =
  | Omit<PushedEvent, "id" | "eventDate">
  | Omit<PoppedEvent, "id" | "eventDate">
  | Omit<ReplacedEvent, "id" | "eventDate">
  | Omit<StepPushedEvent, "id" | "eventDate">
  | Omit<StepPoppedEvent, "id" | "eventDate">
  | Omit<StepReplacedEvent, "id" | "eventDate">

type BlockedNavigation = { action: NavigationAction }

declare function useBlocker(options: {
  shouldBlock: (action: NavigationAction) => boolean
  onBlocked: (
    blockedNavigation: BlockedNavigation,
    actions: { proceed: () => void },
  ) => void
}): void
```

`shouldBlock`과 `onBlocked`가 받는 값은 이벤트가 아니라 **아직 이벤트가 되기 전의 네비게이션 액션**이다. 코어의 `onBefore*` 훅 시점에는 이벤트 `id`와 `eventDate`가 아직 할당되지 않았기 때문에 이 필드들은 포함되지 않는다. 각 액션은 `name` 필드(`"Pushed"`, `"Popped"`, `"Replaced"`, `"StepPushed"`, `"StepPopped"`, `"StepReplaced"`)로 구분할 수 있다.

## 5. 시멘틱

### 차단

- `shouldBlock(action)` — 네비게이션 액션을 받아 차단 여부를 반환. `true`면 `preventDefault()`로 차단.
- 액션 발생 시점에 **commit된 render의 `shouldBlock`**이 사용된다.
- 블로커는 **activity 단위**로 동작. `isActive: true`인 activity의 블로커만 활성화.

### 통보

- `onBlocked(blockedNavigation, { proceed })` — 네비게이션이 차단될 때마다 호출.
- `blockedNavigation`은 순수 데이터. `{ action: NavigationAction }`.
- `proceed`는 차단된 해당 네비게이션을 이 블로커를 우회하여 재시도하는 `() => void` 함수.

### proceed

- `proceed()` — `onBlocked` 콜백의 두 번째 인자로 전달. 차단된 네비게이션 액션을 해당 블로커만 우회하여 재실행한다.
- **호출한 블로커만 우회한다.** 동일 activity의 다른 블로커는 독립적으로 동작하며, 그 블로커의 `shouldBlock`이 `true`면 다시 차단된다.
- 여러 번 호출 시 매번 독립적으로 실행된다.

### Composition

- 각 `useBlocker`는 **항상 독립적**으로 동작한다. 훅 간 암묵적 연결이 없다.
- 같은 activity에 복수 `useBlocker` 등록 가능. 경고/에러 없음.
- 차단 시 `shouldBlock`이 `true`인 **모든** 훅의 `onBlocked`가 호출된다.

### Lifecycle

- 블로커가 비활성화(unmount)되면 `shouldBlock`은 `() => false`로 간주. `proceed` 재시도 시 자동 통과.
- unmount 이전에 캡처된 `proceed`는 unmount 이후에도 호출 가능하다. 해당 블로커는 자동 통과한다.
- `onBlocked` 내 비동기 작업의 lifecycle 관리는 개발자 책임이다.

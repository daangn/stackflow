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
type NavigationEvent =
  | PushedEvent
  | PoppedEvent
  | ReplacedEvent
  | StepPushedEvent
  | StepPoppedEvent
  | StepReplacedEvent

type BlockedNavigation = { event: NavigationEvent }

declare function useBlocker(options: {
  shouldBlock: (event: NavigationEvent) => boolean
  onBlocked: (blockedNavigation: BlockedNavigation) => void
}): {
  bypass: (blockedNavigation: BlockedNavigation) => void
}
```

각 이벤트는 `name` 필드(`"Pushed"`, `"Popped"`, `"Replaced"`, `"StepPushed"`, `"StepPopped"`, `"StepReplaced"`)로 구분할 수 있다. `shouldBlock`에서 이를 활용해 차단할 이벤트 종류를 선택한다.

## 5. 시멘틱

### 차단

- `shouldBlock(event)` — 네비게이션 이벤트를 받아 차단 여부를 반환. `true`면 `preventDefault()`로 차단.
- 이벤트 발생 시점에 **commit된 render의 `shouldBlock`**이 사용된다.
- 블로커는 **activity 단위**로 동작. `isActive: true`인 activity의 블로커만 활성화.

### 통보

- `onBlocked(blockedNavigation)` — 네비게이션이 차단될 때마다 호출.
- `blockedNavigation`은 순수 데이터. `{ event: NavigationEvent }`.

### bypass

- `bypass(blockedNavigation)` — `useBlocker` 반환값에 포함된 함수. `blockedNavigation`을 인자로 받아 해당 네비게이션을 재시도한다.
- **호출한 블로커만 우회한다.** 동일 activity의 다른 블로커는 독립적으로 동작하며, 그 블로커의 `shouldBlock`이 `true`면 다시 차단된다.
- 같은 `blockedNavigation`으로 여러 번 호출하면 **매 호출마다 재시도**한다 (비멱등).

### Composition

- 각 `useBlocker`는 **항상 독립적**으로 동작한다. 훅 간 암묵적 연결이 없다.
- 같은 activity에 복수 `useBlocker` 등록 가능. 경고/에러 없음.
- 차단 시 `shouldBlock`이 `true`인 **모든** 훅의 `onBlocked`가 호출된다.

### Lifecycle

- 블로커가 비활성화(unmount)되면 `shouldBlock`은 `() => false`로 간주. bypass 시 자동 통과.
- `onBlocked` 내 비동기 작업의 lifecycle 관리는 개발자 책임이다.

## 6. 사용 예시

### 확인 다이얼로그 (pop만 차단)

```tsx
function WritingPage() {
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState<BlockedNavigation | null>(null)

  const { bypass } = useBlocker({
    shouldBlock: (event) => event.name === "Popped" && dirty,
    onBlocked: (blocked) => {
      setPending(blocked)
    },
  })

  return (
    <AppScreen>
      <Form onChange={() => setDirty(true)} />
      {pending && (
        <Dialog
          title="정말 나가시겠습니까?"
          onConfirm={() => { bypass(pending); setPending(null) }}
          onCancel={() => setPending(null)}
        />
      )}
    </AppScreen>
  )
}
```

### 모든 네비게이션 차단

```tsx
function WritingPage() {
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState<BlockedNavigation | null>(null)

  const { bypass } = useBlocker({
    shouldBlock: () => dirty,
    onBlocked: (blocked) => {
      setPending(blocked)
    },
  })

  return (
    <AppScreen>
      <Form onChange={() => setDirty(true)} />
      {pending && (
        <Dialog
          title="저장하지 않은 변경사항이 있습니다"
          onConfirm={() => { bypass(pending); setPending(null) }}
          onCancel={() => setPending(null)}
        />
      )}
    </AppScreen>
  )
}
```

### 다이얼로그 토글 (두 번째 back → 닫기)

```tsx
function WritingPage() {
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState<BlockedNavigation | null>(null)

  const { bypass } = useBlocker({
    shouldBlock: (event) => event.name === "Popped" && dirty,
    onBlocked: (blocked) => {
      setPending((prev) => prev !== null ? null : blocked)
    },
  })

  return (
    <AppScreen>
      <Form onChange={() => setDirty(true)} />
      {pending && (
        <Dialog
          title="정말 나가시겠습니까?"
          onConfirm={() => { bypass(pending); setPending(null) }}
          onCancel={() => setPending(null)}
        />
      )}
    </AppScreen>
  )
}
```

### 저장 후 이탈

```tsx
function WritingPage() {
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState<BlockedNavigation | null>(null)

  const { bypass } = useBlocker({
    shouldBlock: (event) => event.name === "Popped" && dirty,
    onBlocked: (blocked) => {
      setPending(blocked)
    },
  })

  const handleSaveAndLeave = async () => {
    await save()
    if (pending) bypass(pending)
    setPending(null)
  }

  return (
    <AppScreen>
      <Form onChange={() => setDirty(true)} />
      {pending && (
        <Dialog
          title="저장하지 않은 변경사항이 있습니다"
          onSaveAndLeave={handleSaveAndLeave}
          onLeave={() => { bypass(pending); setPending(null) }}
          onCancel={() => setPending(null)}
        />
      )}
    </AppScreen>
  )
}
```

### Multipop 처리

`pop({ count: 3 })`은 독립적인 pop 이벤트 3개를 발생시킨다. 각각 별개로 차단되므로 `onBlocked`가 3번 호출된다.

```tsx
function WritingPage() {
  const [dirty, setDirty] = useState(false)
  const [pendingList, setPendingList] = useState<BlockedNavigation[]>([])

  const { bypass } = useBlocker({
    shouldBlock: (event) => event.name === "Popped" && dirty,
    onBlocked: (blocked) => {
      setPendingList((prev) => [...prev, blocked])
    },
  })

  return (
    <AppScreen>
      <Form onChange={() => setDirty(true)} />
      {pendingList.length > 0 && (
        <Dialog
          title="정말 나가시겠습니까?"
          onConfirm={() => {
            pendingList.forEach((b) => bypass(b))
            setPendingList([])
          }}
          onCancel={() => setPendingList([])}
        />
      )}
    </AppScreen>
  )
}
```

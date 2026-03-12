# blockerPlugin 테스트 계획

## Context

`blockerPlugin`은 코어 변경 없이 `StackflowReactPlugin`으로 구현된 화면 이탈 방지 플러그인이다:
- `blockerPlugin()` (무인자) — 플러그인 등록
- `useBlocker({ shouldBlock, onBlocked })` — 액티비티 컴포넌트에서 차단 정책 선언

`shouldBlock`과 `onBlocked`가 받는 값은 `NavigationAction` 타입으로, 이벤트가 되기 전의 네비게이션 액션이다 (`id`, `eventDate` 미포함). 스펙의 시멘틱 섹션(§5)을 기준으로 테스트 항목을 정의한다.

## 테스트 항목

### 1. 차단 (Blocking)

#### 1-1. 기본 차단
- `shouldBlock`이 `true`를 반환하면 pop이 차단된다
- `shouldBlock`이 `true`를 반환하면 push가 차단된다
- `shouldBlock`이 `true`를 반환하면 replace가 차단된다
- `shouldBlock`이 `true`를 반환하면 stepPush가 차단된다
- `shouldBlock`이 `true`를 반환하면 stepPop이 차단된다
- `shouldBlock`이 `true`를 반환하면 stepReplace가 차단된다

#### 1-2. 기본 허용
- `shouldBlock`이 `false`를 반환하면 네비게이션이 허용된다

#### 1-3. 액션 선택적 차단
- Replaced는 차단하고 Pushed는 허용할 수 있다
- shouldBlock은 마지막으로 commit된 render에서 전달된 함수를 사용한다

#### 1-4. Activity 스코프
- 액티비티 위에 다른 액티비티가 push되면 밑에 있던 액티비티의 블로커는 비활성화된다
- 액티비티 위에 push되어있던 모든 액티비티가 pop으로 exit되면 밑에 있던 액티비티의 블로커가 다시 활성화된다
- 액티비티가 replace되면 해당 액티비티의 블로커는 비활성화된다
- 액티비티가 pop되면 해당 액티비티의 블로커는 비활성화된다

### 2. 통보 (Notification)

- 블로커가 네비게이션을 차단하면 onBlocked가 호출된다
- 차단하지 않은 블로커의 onBlocked는 호출되지 않는다
- 차단되지 않은 네비게이션에 대해서는 onBlocked가 호출되지 않는다

### 3. override

#### 3-1. 기본 override
- `override(fn)` 콜백 내 네비게이션은 블로커를 우회한다

#### 3-2. 호출 블로커만 우회
- `override`는 호출한 블로커만 우회하고, 다른 블로커가 `shouldBlock: true`이면 다시 차단된다

#### 3-3. 독립 실행
- `override`를 여러 번 호출하면 매번 독립적으로 실행된다

### 4. Composition (다중 블로커)

- 복수 블로커 등록 시, `shouldBlock`이 `true`인 모든 훅의 `onBlocked`가 호출된다
- 하나의 블로커만 `shouldBlock: true`이면 그 블로커의 `onBlocked`만 호출된다
- 하나의 블로커의 shouldBlock이라도 true를 반환하면 내비게이션이 차단된다
- 모든 블로커의 shouldBlock이 false를 반환하면 내비게이션이 허용된다

### 5. Lifecycle

- 블로커를 소유한 컴포넌트가 unmount되면 해당 블로커는 더 이상 차단 여부에 영향을 주지 않는다
- 블로커를 소유한 컴포넌트가 unmount되면 해당 블로커의 onBlocked도 더 이상 호출되지 않는다
- 블로커를 소유한 컴포넌트가 unmount되어도 해당 블로커의 `override`는 동작하되, 해당 블로커의 shouldBlock이 `false`를 반환했을 때와 동일하게 동작한다

---

## 구현 파일

- **테스트**: `extensions/plugin-blocker/src/blockerPlugin.spec.tsx`
- **플러그인**: `extensions/plugin-blocker/src/blockerPlugin.ts`
- **Export**: `extensions/plugin-blocker/src/index.ts`

## 검증 방법

```bash
cd extensions/plugin-blocker && yarn test
```

## 세부 가이드라인

> 새로운 가이드라인이 내려오면 이 단락을 업데이트하세요.

### API

- `@stackflow/react/future의 stackflow({ config, components, plugins })` 사용
  - 이 플러그인은 `@stackflow/react/future` 전용
- activity 등록은 `defineConfig()` + `declare module "@stackflow/config" { interface Register }` 타입 확장

### 테스트 구조

- 매 `it` 블록마다 `stackflow()`를 새로 호출해 독립된 인스턴스 생성
- 모든 테스트를 한 파일에 모아서 관리
- `// given / // when / // then` 주석으로 가독성 확보

### 스택 상태 검증

- DOM 대신 spyPlugin으로 검증: `onInit({ actions })`에서 `getStack` 캡처
- `getStack().activities` 전체 배열 비교 (active activity의 steps만 비교하면 false positive 가능)

#### push 성공 검증 패턴

push가 성공했는지 꼼꼼히 확인하려면 세 가지를 모두 검증한다:

```tsx
const activitiesBefore = getStack().activities;
await act(async () => { actions.push("OtherActivity", {}); });
const activities = getStack().activities;
expect(activities).toHaveLength(activitiesBefore.length + 1);
expect(activities[activities.length - 1].name).toBe("OtherActivity");
expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
```

#### pop 성공 검증 패턴

`transitionState`가 `"enter-done"` 또는 `"enter-active"`인 액티비티 수가 줄었는지 확인한다:

```tsx
const activeCountBefore = getStack().activities.filter(
  (a) => a.transitionState === "enter-done" || a.transitionState === "enter-active",
).length;
await act(async () => { actions.pop(); });
const activeCountAfter = getStack().activities.filter(
  (a) => a.transitionState === "enter-done" || a.transitionState === "enter-active",
).length;
expect(activeCountAfter).toBe(activeCountBefore - 1);
```

### given / when / then 규칙

- `expect`는 반드시 `// then` 블록에서만 사용한다
- setup 단계(given)와 중간 조작 단계(when)에서는 assertion을 하지 않는다
- React state setter는 `useEffect` 안에서 외부 변수에 할당해 테스트 스코프에 노출한다:

```tsx
let setSomeState!: (v: boolean) => void;
function TestActivity() {
  const [state, setState] = React.useState(false);
  React.useEffect(() => { setSomeState = setState; }, []);
  // ...
}
```

### act 사용법

- `await act(async () => { ... })` 패턴 고정 (concurrent rendering 대응)
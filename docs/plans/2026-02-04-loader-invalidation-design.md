# Loader Data Invalidation Design

## Overview

Stackflow의 Loader 시스템에 invalidation 기능을 추가한다. 캐시 레이어는 외부(TanStack Query 등)에 위임하고, Stackflow는 "언제 loader를 다시 호출할지"만 결정하는 unopinionated한 인터페이스를 제공한다.

## Goals

1. **명시적 invalidation**: 개발자가 `invalidate()` 함수를 직접 호출하여 loader 재실행
2. **Activity 상태 기반 invalidation**: `shouldInvalidate` 콜백으로 activity 상태 변화 시 자동 재실행 제어
3. **하위 호환성**: 기존 `useLoaderData()` API 유지
4. **Unopinionated**: loader data를 Promise 그대로 반환하여 사용자가 Suspense 사용 여부 결정

## Non-Goals

- 내장 캐시 레이어 제공 (외부 쿼리 클라이언트에 위임)
- 다른 activity의 loader invalidation (현재 activity만 대상)

## Architecture

### 핵심 문제

Core의 `activity.context`는 immutable하다. Event sourcing 패턴으로 인해 한번 저장된 `activityContext.loaderData`는 수정할 수 없다.

### 해결 방안

`loaderPlugin`의 `wrapActivity` hook을 사용하여 각 Activity마다 독립적인 React Context를 제공한다. loaderData를 React state로 관리하여 invalidation 시 re-render를 트리거한다.

```
┌─────────────────────────────────────────────────────┐
│ loaderPlugin.wrapActivity                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ActivityLoaderProvider                          │ │
│ │   - loaderData: state (초기값: context에서)     │ │
│ │   - invalidate: setState(loadData(...))         │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Activity Component                          │ │ │
│ │ │   useLoader() → { data, invalidate }        │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## API Design

### 1. Loader 설정 타입 확장

```typescript
// 기존: 함수만 전달
type ActivityLoader<T> = (args: ActivityLoaderArgs<T>) => any;

// 신규: 함수 또는 옵션 객체
type ActivityLoaderConfig<T> =
  | ActivityLoader<T>
  | {
      fn: ActivityLoader<T>;
      shouldInvalidate?: (args: {
        prevActivity: Activity;
        currentActivity: Activity;
      }) => boolean;
    };
```

### 2. Config 사용 예시

```typescript
// stackflow.config.ts
import { defineConfig } from "@stackflow/config";
import { articleLoader } from "./Article.loader";

export const config = defineConfig({
  activities: [
    // 단순 케이스 - 함수만
    {
      name: "Home",
      route: { path: "/" },
      loader: homeLoader,
    },

    // 고급 케이스 - shouldInvalidate 포함
    {
      name: "Article",
      route: { path: "/articles/:articleId" },
      loader: {
        fn: articleLoader,
        shouldInvalidate: ({ prevActivity, currentActivity }) => {
          // activity가 다시 active 될 때 (back navigation)
          return !prevActivity.isActive && currentActivity.isActive;
        },
      },
    },
  ],
});
```

### 3. `useLoader()` Hook

```typescript
// @stackflow/react/future
export function useLoader<T extends (...args: any[]) => any>(options: {
  loaderFn: T;  // 실제 loader 함수를 객체 프로퍼티로 전달
}): {
  data: ReturnType<T>;  // Promise<X> | X - loader 반환 타입 그대로
  invalidate: () => void;
};
```

**내부 동작:**
- `loaderFn` 프로퍼티를 통해 타입 자동 추론
- 런타임에 config에 등록된 loader와 동일한지 검증 (불일치 시 에러)

```typescript
function useLoader<T extends (...args: any[]) => any>(options: { loaderFn: T }) {
  const activity = useActivity();
  const configLoader = getLoaderFromConfig(activity.name);

  if (options.loaderFn !== configLoader) {
    throw new Error(
      `Loader mismatch: expected loader for "${activity.name}" activity`
    );
  }

  // ...
}
```

**사용 예시:**

```tsx
// Article.tsx
import { use } from "react";
import { useLoader } from "@stackflow/react/future";
import { articleLoader } from "./Article.loader";

const Article: ActivityComponentType = () => {
  const { data, invalidate } = useLoader({ loaderFn: articleLoader });

  // 사용자가 Suspense 사용 여부 결정
  const resolved = use(data);  // Suspense 트리거

  // 또는 TanStack Query와 조합
  // const query = useSuspenseQuery({
  //   queryKey: ['article'],
  //   queryFn: () => data,
  // });

  return (
    <div>
      <h1>{resolved.title}</h1>
      <img src={resolved.imageUrl} alt={resolved.title} />
      <button onClick={() => invalidate()}>
        새로고침
      </button>
    </div>
  );
};
```

### 4. `useLoaderData()` 유지 (하위 호환)

`useLoaderData()`는 기존 동작을 완전히 유지합니다.

```typescript
// 기존 API 완전 유지 - 제네릭 제약, Suspense 메커니즘 모두 동일
export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,  // 기존 제네릭 제약 유지
>(): Awaited<ReturnType<T>> {
  // 내부적으로 ActivityLoaderContext에서 데이터 가져옴
  // useLoader()를 사용하지 않음 (loader 파라미터 불필요)
  const { loaderData } = useContext(ActivityLoaderContext);
  return useThenable(resolve(loaderData));  // 기존 useThenable + resolve 유지
}
```

**변경 없는 부분:**
- 제네릭 제약: `(args: ActivityLoaderArgs<any>) => any`
- 반환 타입: `Awaited<ReturnType<T>>`
- Suspense 메커니즘: `useThenable()` + `resolve()` (React 18 호환)
- 호출 방식: `useLoaderData<typeof articleLoader>()`

**변경되는 부분:**
- 데이터 소스만 `activity.context` → `ActivityLoaderContext`

## Behavior

### `invalidate()` 호출 시

1. 현재 activity의 loader 함수를 다시 호출
2. React state 업데이트 → re-render
3. 사용자가 `use(data)` 호출 시 Suspense fallback 표시
4. Promise resolve 후 새 데이터로 렌더링

### `shouldInvalidate` 콜백

- Activity 상태가 변경될 때마다 호출됨
- `prevActivity`: 이전 상태의 Activity 객체 전체
- `currentActivity`: 현재 상태의 Activity 객체 전체
- `true` 반환 시 loader 자동 재호출

**구현 방식:**

`ActivityLoaderProvider` 내부에서 Core store를 구독하여 activity 상태 변화를 감지합니다.
useEffect가 아닌 event-based subscription 방식으로, React의 권장 패턴을 따릅니다.

```typescript
// ActivityLoaderProvider 내부
const actions = useCoreActions();
const prevActivityRef = useRef(activity);

useEffect(() => {
  return actions.subscribe(() => {
    const stack = actions.getStack();
    const currentActivity = stack.activities.find(a => a.id === activity.id);
    const prevActivity = prevActivityRef.current;

    if (shouldInvalidate?.({ prevActivity, currentActivity })) {
      setLoaderData(loadData(currentActivity.name, currentActivity.params));
    }

    prevActivityRef.current = currentActivity;
  });
}, []);
```

**주요 사용 시나리오:**

```typescript
// Back navigation으로 돌아왔을 때
shouldInvalidate: ({ prevActivity, currentActivity }) => {
  return !prevActivity.isActive && currentActivity.isActive;
}

// 특정 transition state 도달 시
shouldInvalidate: ({ prevActivity, currentActivity }) => {
  return currentActivity.transitionState === "enter-done"
    && prevActivity.transitionState !== "enter-done";
}
```

## Implementation Plan

### Phase 1: Type 정의 수정

1. `@stackflow/config`의 `ActivityLoader` 타입을 `ActivityLoaderConfig`로 확장
2. `ActivityDefinition`에서 새 타입 사용
3. Loader 함수 추출 유틸리티 함수 추가 (`getLoaderFn`, `getShouldInvalidate`)

### Phase 2: ActivityLoaderContext 구현

1. `ActivityLoaderContext` 생성 (`integrations/react/src/future/loader/`)
2. `ActivityLoaderProvider` 컴포넌트 구현
   - `loaderData`를 React state로 관리
   - `invalidate` 함수 제공
3. `loaderPlugin`의 `wrapActivity` hook에서 Provider 적용

### Phase 3: `useLoader()` Hook 구현

1. `useLoader()` hook 생성
   - Context에서 `{ data, invalidate }` 반환
   - data는 loader 반환 타입 그대로 (Promise일 수도, 아닐 수도)
2. `useLoaderData()` 내부 구현을 `useLoader()` + `useThenable()` 기반으로 변경
   - 기존 제네릭 제약 유지: `(args: ActivityLoaderArgs<any>) => any`
   - 기존 Suspense 메커니즘 유지: `useThenable(resolve(data))`

### Phase 4: `shouldInvalidate` 콜백 지원

1. `loaderPlugin`에서 activity 상태 변화 감지
2. `shouldInvalidate` 콜백 호출 로직 추가
3. `true` 반환 시 자동 invalidation 트리거

### Phase 5: 테스트 및 문서화

1. Unit tests for `useLoader()` hook
2. Integration tests for `shouldInvalidate` scenarios
3. Demo app에 예제 추가
4. API documentation 업데이트

## Migration Guide

기존 코드는 변경 없이 동작합니다:

```typescript
// Before & After - 둘 다 동작 (Suspense 자동 트리거)
const data = useLoaderData<typeof articleLoader>();

// 새 기능: invalidation + Suspense 제어
import { articleLoader } from "./Article.loader";

const { data, invalidate } = useLoader({ loaderFn: articleLoader });
const resolved = use(data);  // 직접 Suspense 제어
```

## Resolved Questions

1. ~~`invalidate()` 호출 시 Suspense vs stale-while-revalidate~~ → **사용자가 `use()` 호출 여부로 결정**
2. ~~다른 activity의 loader도 invalidate 가능해야 하나?~~ → **현재 activity만 지원**
3. ~~loader data 저장 방식~~ → **React Context + state로 관리 (Core immutable 유지)**
4. ~~`useLoader()` 타입 안정성~~ → **`{ loaderFn }` 객체 파라미터로 전달 + 런타임 검증**
5. ~~`shouldInvalidate` 트리거 방식~~ → **Core store 구독 (event-based, useEffect 아님)**

## References

- [TanStack Router - Data Loading](https://tanstack.com/router/v1/docs/framework/react/guide/data-loading)
- [React Router - useRevalidator](https://reactrouter.com/en/main/hooks/use-revalidator)
- [React Router - shouldRevalidate](https://reactrouter.com/en/main/route/should-revalidate)

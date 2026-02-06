# Loader Data Invalidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Loader Data Invalidation 기능 구현 - `useLoader()` hook과 `shouldInvalidate` 콜백을 통해 loader data를 재호출할 수 있는 메커니즘 제공

**Architecture:** loaderPlugin의 `wrapActivity` hook을 사용하여 Activity마다 독립적인 React Context를 제공한다. loaderData를 React state로 관리하고, Core store 구독을 통해 activity 상태 변화 감지 시 `shouldInvalidate` 콜백을 호출한다.

**Tech Stack:** TypeScript, React (useState, useContext, useEffect, useCallback, useRef)

**Design Document:** `docs/plans/2026-02-04-loader-invalidation-design.md` 참조

---

## Task 1: ActivityLoaderConfig 타입 정의

**Files:**
- Modify: `config/src/ActivityLoader.ts`
- Modify: `config/src/ActivityDefinition.ts`
- Modify: `config/src/index.ts`

**Step 1: ActivityLoaderConfig 타입 추가**

`config/src/ActivityLoader.ts` 파일 끝에 추가:

```typescript
import type { Activity } from "@stackflow/core";

export interface ActivityLoaderConfigObject<
  ActivityName extends RegisteredActivityName,
> {
  fn: ActivityLoader<ActivityName>;
  shouldInvalidate?: (args: {
    prevActivity: Activity;
    currentActivity: Activity;
  }) => boolean;
}

export type ActivityLoaderConfig<ActivityName extends RegisteredActivityName> =
  | ActivityLoader<ActivityName>
  | ActivityLoaderConfigObject<ActivityName>;
```

**Step 2: 유틸리티 함수 추가**

`config/src/ActivityLoader.ts` 파일에 추가:

```typescript
export function getLoaderFn<ActivityName extends RegisteredActivityName>(
  loaderConfig: ActivityLoaderConfig<ActivityName> | undefined,
): ActivityLoader<ActivityName> | undefined {
  if (!loaderConfig) {
    return undefined;
  }
  if (typeof loaderConfig === "function") {
    return loaderConfig;
  }
  return loaderConfig.fn;
}

export function getShouldInvalidate<ActivityName extends RegisteredActivityName>(
  loaderConfig: ActivityLoaderConfig<ActivityName> | undefined,
): ActivityLoaderConfigObject<ActivityName>["shouldInvalidate"] | undefined {
  if (!loaderConfig || typeof loaderConfig === "function") {
    return undefined;
  }
  return loaderConfig.shouldInvalidate;
}
```

**Step 3: ActivityDefinition 타입 수정**

`config/src/ActivityDefinition.ts` 파일의 `loader` 프로퍼티 타입 변경:

```typescript
import type { ActivityLoaderConfig } from "./ActivityLoader";

export interface ActivityDefinition<
  ActivityName extends RegisteredActivityName,
> {
  name: ActivityName;
  loader?: ActivityLoaderConfig<any>;  // ActivityLoader에서 ActivityLoaderConfig로 변경
}
```

**Step 4: index.ts에서 export 추가**

`config/src/index.ts`에 추가:

```typescript
export type {
  ActivityLoaderConfig,
  ActivityLoaderConfigObject,
} from "./ActivityLoader";
export { getLoaderFn, getShouldInvalidate } from "./ActivityLoader";
```

**Step 5: 빌드 확인**

Run: `cd config && yarn build`
Expected: 빌드 성공

**Step 6: Commit**

```bash
git add config/src/ActivityLoader.ts config/src/ActivityDefinition.ts config/src/index.ts
git commit -m "$(cat <<'EOF'
feat(config): add ActivityLoaderConfig type with shouldInvalidate support

- Add ActivityLoaderConfig union type (function | object with fn + shouldInvalidate)
- Add getLoaderFn and getShouldInvalidate utility functions
- Update ActivityDefinition to use ActivityLoaderConfig

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: ActivityLoaderContext 생성

**Files:**
- Create: `integrations/react/src/future/loader/ActivityLoaderContext.tsx`

**Step 1: Context 파일 생성**

`integrations/react/src/future/loader/ActivityLoaderContext.tsx`:

```typescript
import { createContext } from "react";

export interface ActivityLoaderContextValue {
  loaderData: unknown;
  invalidate: () => void;
}

export const ActivityLoaderContext =
  createContext<ActivityLoaderContextValue | null>(null);
```

**Step 2: 빌드 확인**

Run: `cd integrations/react && yarn build`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add integrations/react/src/future/loader/ActivityLoaderContext.tsx
git commit -m "$(cat <<'EOF'
feat(react): create ActivityLoaderContext for loader data management

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: ActivityLoaderProvider 컴포넌트 구현

**Files:**
- Create: `integrations/react/src/future/loader/ActivityLoaderProvider.tsx`

**Step 1: Provider 컴포넌트 생성**

`integrations/react/src/future/loader/ActivityLoaderProvider.tsx`:

```typescript
import type { Activity } from "@stackflow/core";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCoreActions } from "../../__internal__/core/useCoreActions";
import { ActivityLoaderContext } from "./ActivityLoaderContext";

interface ActivityLoaderProviderProps {
  activity: Activity;
  initialLoaderData: unknown;
  loadData: (activityName: string, activityParams: {}) => unknown;
  shouldInvalidate?: (args: {
    prevActivity: Activity;
    currentActivity: Activity;
  }) => boolean;
  children: ReactNode;
}

export function ActivityLoaderProvider({
  activity,
  initialLoaderData,
  loadData,
  shouldInvalidate,
  children,
}: ActivityLoaderProviderProps) {
  const [loaderData, setLoaderData] = useState(initialLoaderData);
  const actions = useCoreActions();
  const prevActivityRef = useRef<Activity>(activity);

  const invalidate = useCallback(() => {
    const newLoaderData = loadData(activity.name, activity.params);
    setLoaderData(newLoaderData);
  }, [activity.name, activity.params, loadData]);

  useEffect(() => {
    if (!shouldInvalidate) {
      return;
    }

    const unsubscribe = actions.subscribe(() => {
      const stack = actions.getStack();
      const currentActivity = stack.activities.find(
        (a) => a.id === activity.id,
      );

      if (!currentActivity) {
        return;
      }

      const prevActivity = prevActivityRef.current;

      if (shouldInvalidate({ prevActivity, currentActivity })) {
        const newLoaderData = loadData(
          currentActivity.name,
          currentActivity.params,
        );
        setLoaderData(newLoaderData);
      }

      prevActivityRef.current = currentActivity;
    });

    return unsubscribe;
  }, [actions, activity.id, loadData, shouldInvalidate]);

  return (
    <ActivityLoaderContext.Provider value={{ loaderData, invalidate }}>
      {children}
    </ActivityLoaderContext.Provider>
  );
}
```

**Step 2: 빌드 확인**

Run: `cd integrations/react && yarn build`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add integrations/react/src/future/loader/ActivityLoaderProvider.tsx
git commit -m "$(cat <<'EOF'
feat(react): implement ActivityLoaderProvider with invalidation support

- Manage loaderData as React state
- Subscribe to Core store for activity state changes
- Call shouldInvalidate callback on state changes
- Provide invalidate function via context

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: useLoader hook 구현

**Files:**
- Create: `integrations/react/src/future/loader/useLoader.ts`

**Step 1: useLoader hook 생성**

`integrations/react/src/future/loader/useLoader.ts`:

```typescript
import { useContext } from "react";
import { useActivity } from "../../stable";
import { ActivityLoaderContext } from "./ActivityLoaderContext";
import { useConfig } from "../config/useConfig";
import { getLoaderFn } from "@stackflow/config";

export function useLoader<T extends (...args: any[]) => any>(options: {
  loaderFn: T;
}): {
  data: ReturnType<T>;
  invalidate: () => void;
} {
  const activity = useActivity();
  const config = useConfig();
  const context = useContext(ActivityLoaderContext);

  if (!context) {
    throw new Error(
      "useLoader() must be used within an ActivityLoaderProvider. " +
        "Make sure you are using the loaderPlugin.",
    );
  }

  // Runtime validation: check if the provided loader matches the config
  const activityConfig = config.activities.find(
    (a) => a.name === activity.name,
  );
  const configLoaderFn = getLoaderFn(activityConfig?.loader);

  if (options.loaderFn !== configLoaderFn) {
    throw new Error(
      `Loader mismatch: the provided loader does not match the loader ` +
        `registered for "${activity.name}" activity in the config.`,
    );
  }

  return {
    data: context.loaderData as ReturnType<T>,
    invalidate: context.invalidate,
  };
}
```

**Step 2: 빌드 확인**

Run: `cd integrations/react && yarn build`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add integrations/react/src/future/loader/useLoader.ts
git commit -m "$(cat <<'EOF'
feat(react): implement useLoader hook with runtime validation

- Accept loaderFn via object parameter for type inference
- Validate loader matches config at runtime
- Return data and invalidate function from context

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: loaderPlugin에 wrapActivity 추가

**Files:**
- Modify: `integrations/react/src/future/loader/loaderPlugin.tsx`

**Step 1: import 추가**

`loaderPlugin.tsx` 파일 상단에 import 추가:

```typescript
import { getLoaderFn, getShouldInvalidate } from "@stackflow/config";
import { ActivityLoaderProvider } from "./ActivityLoaderProvider";
```

**Step 2: wrapActivity hook 추가**

`loaderPlugin()` 함수 내부 return 객체에 `wrapActivity` 추가:

```typescript
export function loaderPlugin<
  T extends ActivityDefinition<RegisteredActivityName>,
  R extends {
    [activityName in RegisteredActivityName]: ActivityComponentType<any>;
  },
>(
  input: StackflowInput<T, R>,
  loadData: (activityName: string, activityParams: {}) => unknown,
): StackflowReactPlugin {
  return () => {
    return {
      key: "plugin-loader",
      overrideInitialEvents({ initialEvents, initialContext }) {
        // ... existing code ...
      },
      onBeforePush: createBeforeRouteHandler(input, loadData),
      onBeforeReplace: createBeforeRouteHandler(input, loadData),
      wrapActivity({ activity, initialContext }) {
        const matchActivity = input.config.activities.find(
          (a) => a.name === activity.name,
        );

        if (!matchActivity?.loader) {
          return <>{activity.render()}</>;
        }

        const shouldInvalidate = getShouldInvalidate(matchActivity.loader);
        const initialLoaderData = (activity.context as any)?.loaderData;

        return (
          <ActivityLoaderProvider
            activity={activity}
            initialLoaderData={initialLoaderData}
            loadData={loadData}
            shouldInvalidate={shouldInvalidate}
          >
            {activity.render()}
          </ActivityLoaderProvider>
        );
      },
    };
  };
}
```

**Step 3: getLoaderFn 사용하도록 기존 코드 수정**

`overrideInitialEvents`와 `createBeforeRouteHandler`에서 `matchActivity.loader`를 직접 사용하던 부분을 `getLoaderFn(matchActivity.loader)`로 변경:

```typescript
// overrideInitialEvents 내부
const loader = getLoaderFn(matchActivity?.loader);

// createBeforeRouteHandler 내부
const loaderFn = getLoaderFn(matchActivity.loader);
const loaderData = loaderFn && resolve(loadData(activityName, activityParams));
```

**Step 4: 빌드 확인**

Run: `cd integrations/react && yarn build`
Expected: 빌드 성공

**Step 5: Commit**

```bash
git add integrations/react/src/future/loader/loaderPlugin.tsx
git commit -m "$(cat <<'EOF'
feat(react): add wrapActivity to loaderPlugin for invalidation support

- Wrap activities with ActivityLoaderProvider when loader exists
- Extract shouldInvalidate from ActivityLoaderConfig
- Update existing code to use getLoaderFn utility

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: useLoaderData 수정

**Files:**
- Modify: `integrations/react/src/future/loader/useLoaderData.ts`

**Step 1: useLoaderData 수정**

`integrations/react/src/future/loader/useLoaderData.ts` 파일 전체 교체:

```typescript
import type { ActivityLoaderArgs } from "@stackflow/config";
import { useContext } from "react";
import { resolve } from "../../__internal__/utils/SyncInspectablePromise";
import { useThenable } from "../../__internal__/utils/useThenable";
import { useActivity } from "../../stable";
import { ActivityLoaderContext } from "./ActivityLoaderContext";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  const context = useContext(ActivityLoaderContext);

  // ActivityLoaderProvider가 있으면 context에서 가져옴
  if (context) {
    return useThenable(resolve(context.loaderData));
  }

  // fallback: 기존 방식 (activity.context에서 직접 가져옴)
  const activity = useActivity();
  return useThenable(resolve((activity.context as any)?.loaderData));
}
```

**Step 2: 빌드 확인**

Run: `cd integrations/react && yarn build`
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add integrations/react/src/future/loader/useLoaderData.ts
git commit -m "$(cat <<'EOF'
feat(react): update useLoaderData to use ActivityLoaderContext

- Prefer ActivityLoaderContext when available
- Fallback to activity.context for backward compatibility
- Maintain existing API and behavior

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Export 추가

**Files:**
- Modify: `integrations/react/src/future/loader/index.ts`
- Modify: `integrations/react/src/future/index.ts` (if needed)

**Step 1: loader/index.ts 확인 및 수정**

`integrations/react/src/future/loader/index.ts`에 useLoader export 추가:

```typescript
export { useLoaderData } from "./useLoaderData";
export { useLoader } from "./useLoader";
```

**Step 2: future/index.ts에서 재export 확인**

`integrations/react/src/future/index.ts`에서 loader exports 확인:

```typescript
export { useLoaderData, useLoader } from "./loader";
```

**Step 3: 빌드 확인**

Run: `cd integrations/react && yarn build`
Expected: 빌드 성공

**Step 4: Commit**

```bash
git add integrations/react/src/future/loader/index.ts integrations/react/src/future/index.ts
git commit -m "$(cat <<'EOF'
feat(react): export useLoader from future API

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: 전체 빌드 및 타입 체크

**Step 1: 전체 빌드**

Run: `yarn build`
Expected: 모든 패키지 빌드 성공

**Step 2: 타입 체크**

Run: `yarn typecheck`
Expected: 타입 에러 없음

**Step 3: 린트**

Run: `yarn lint`
Expected: 린트 에러 없음

**Step 4: Commit (필요시)**

빌드 과정에서 생성된 파일이 있다면 커밋

---

## Task 9: 테스트 작성

**Files:**
- Create: `integrations/react/src/future/loader/useLoader.spec.tsx`

**Step 1: 테스트 파일 생성**

`integrations/react/src/future/loader/useLoader.spec.tsx`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useLoader } from "./useLoader";
import { ActivityLoaderContext } from "./ActivityLoaderContext";
import { useActivity } from "../../stable";

// Mock dependencies
vi.mock("../../stable", () => ({
  useActivity: vi.fn(),
}));

vi.mock("../config/useConfig", () => ({
  useConfig: vi.fn(() => ({
    activities: [
      {
        name: "TestActivity",
        loader: mockLoader,
      },
    ],
  })),
}));

const mockLoader = vi.fn(() => Promise.resolve({ title: "Test" }));

describe("useLoader", () => {
  it("should return data and invalidate from context", () => {
    const mockInvalidate = vi.fn();
    const mockLoaderData = { title: "Test Data" };

    vi.mocked(useActivity).mockReturnValue({
      id: "test-id",
      name: "TestActivity",
      params: {},
      context: {},
      isActive: true,
      isTop: true,
      isRoot: false,
      transitionState: "enter-done",
      steps: [],
      enteredBy: {} as any,
      zIndex: 0,
    });

    function TestComponent() {
      const { data, invalidate } = useLoader({ loaderFn: mockLoader });
      return (
        <div>
          <span data-testid="data">{JSON.stringify(data)}</span>
          <button onClick={invalidate}>Invalidate</button>
        </div>
      );
    }

    render(
      <ActivityLoaderContext.Provider
        value={{ loaderData: mockLoaderData, invalidate: mockInvalidate }}
      >
        <TestComponent />
      </ActivityLoaderContext.Provider>,
    );

    expect(screen.getByTestId("data").textContent).toBe(
      JSON.stringify(mockLoaderData),
    );
  });

  it("should throw error when loader does not match config", () => {
    const wrongLoader = vi.fn();

    vi.mocked(useActivity).mockReturnValue({
      id: "test-id",
      name: "TestActivity",
      params: {},
      context: {},
      isActive: true,
      isTop: true,
      isRoot: false,
      transitionState: "enter-done",
      steps: [],
      enteredBy: {} as any,
      zIndex: 0,
    });

    function TestComponent() {
      useLoader({ loaderFn: wrongLoader });
      return null;
    }

    expect(() =>
      render(
        <ActivityLoaderContext.Provider
          value={{ loaderData: {}, invalidate: vi.fn() }}
        >
          <TestComponent />
        </ActivityLoaderContext.Provider>,
      ),
    ).toThrow("Loader mismatch");
  });

  it("should throw error when used outside ActivityLoaderProvider", () => {
    vi.mocked(useActivity).mockReturnValue({
      id: "test-id",
      name: "TestActivity",
      params: {},
      context: {},
      isActive: true,
      isTop: true,
      isRoot: false,
      transitionState: "enter-done",
      steps: [],
      enteredBy: {} as any,
      zIndex: 0,
    });

    function TestComponent() {
      useLoader({ loaderFn: mockLoader });
      return null;
    }

    expect(() => render(<TestComponent />)).toThrow(
      "useLoader() must be used within an ActivityLoaderProvider",
    );
  });
});
```

**Step 2: 테스트 실행**

Run: `yarn test`
Expected: 테스트 통과

**Step 3: Commit**

```bash
git add integrations/react/src/future/loader/useLoader.spec.tsx
git commit -m "$(cat <<'EOF'
test(react): add tests for useLoader hook

- Test data and invalidate returned from context
- Test loader mismatch error
- Test error when used outside provider

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Demo 앱에 예제 추가 (Optional)

**Files:**
- Modify: `demo/src/activities/Article.tsx` (or create new example)

**Step 1: Demo에서 useLoader 사용 예제 추가**

Article.tsx에서 useLoader 사용 예제:

```tsx
import { use } from "react";
import { useLoader } from "@stackflow/react/future";
import { articleLoader } from "./Article.loader";

export const Article = () => {
  const { data, invalidate } = useLoader({ loaderFn: articleLoader });
  const resolved = use(data);

  return (
    <div>
      <h1>{resolved.title}</h1>
      <button onClick={invalidate}>새로고침</button>
    </div>
  );
};
```

**Step 2: shouldInvalidate 사용 예제**

stackflow.config.ts에서:

```typescript
{
  name: "Article",
  route: { path: "/articles/:articleId" },
  loader: {
    fn: articleLoader,
    shouldInvalidate: ({ prevActivity, currentActivity }) => {
      return !prevActivity.isActive && currentActivity.isActive;
    },
  },
}
```

**Step 3: Demo 실행 확인**

Run: `yarn dev`
Expected: Demo 앱 정상 동작

**Step 4: Commit**

```bash
git add demo/
git commit -m "$(cat <<'EOF'
docs(demo): add useLoader and shouldInvalidate example

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | ActivityLoaderConfig 타입 정의 | config/src/ |
| 2 | ActivityLoaderContext 생성 | integrations/react/src/future/loader/ |
| 3 | ActivityLoaderProvider 구현 | integrations/react/src/future/loader/ |
| 4 | useLoader hook 구현 | integrations/react/src/future/loader/ |
| 5 | loaderPlugin에 wrapActivity 추가 | integrations/react/src/future/loader/ |
| 6 | useLoaderData 수정 | integrations/react/src/future/loader/ |
| 7 | Export 추가 | integrations/react/src/future/ |
| 8 | 전체 빌드 및 타입 체크 | - |
| 9 | 테스트 작성 | integrations/react/src/future/loader/ |
| 10 | Demo 앱에 예제 추가 (Optional) | demo/ |

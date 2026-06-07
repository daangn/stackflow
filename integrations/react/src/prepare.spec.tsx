/**
 * `prepare` 런타임 규약
 *
 * `stackflow()` 출력의 `prepare(activityName, activityParams?)`는 React 렌더링
 * 트리 밖에서(렌더 이전 포함) activity component chunk와 data loader를 미리
 * 발사한다. 이 파일이 고정하는 계약:
 *
 * - params 생략 → chunk만, params 전달 → chunk + loader 발사
 * - 반환 Promise는 발사한 모든 작업 완료 시에만 resolve (중간 상태 미노출)
 * - React 트리 부재 상태에서 완전 동작하고 이후 <Stack> 마운트를 방해하지 않음
 * - 모든 실패는 동기 throw가 아닌 원본 reason 그대로의 reject로 전달되고,
 *   chunk 실패는 재-prepare 시 재시도되며, prepare는 core store를 건드리지
 *   않는다(스택 상태·내비게이션 이벤트 불변)
 * - loaderData 주입·lazy 렌더 등 기존 내비게이션 경로와의 책임 분리
 *
 * loader 디듀프, chunk import 중복 발사, 부분 발사 원자성/취소는 계약이 아닌
 * 구현 상세로 남겨둔 동작이므로, 어느 방향으로도 단언하지 않는다.
 *
 * usePrepare 래퍼 동등성은 usePrepare.spec.tsx에, 타입 안전성은
 * prepare.types.spec.tsx에 있다.
 *
 * import는 public entry(`./index`)에서만 한다 — `"@stackflow/react"` 패키지명
 * import는 dist(빌드 산출물)를 가리키므로 src 변경 대신 stale artifact를
 * 검증하게 된다.
 */
import { defineConfig } from "@stackflow/config";
import type { Stack as CoreStack } from "@stackflow/core";
import { act, render, screen } from "@testing-library/react";
import React from "react";
import type { StackflowReactPlugin } from "./index";
import {
  content,
  lazy,
  stackflow,
  structuredActivityComponent,
  useLoaderData,
} from "./index";

/**
 * `Register` 증강은 패키지 전역으로 병합되므로, 모든 spec 파일이 동일한
 * 멤버를 선언한다(동일 타입 재선언은 declaration merging으로 허용된다).
 * 다른 spec과의 이름 충돌 방지를 위해 `Prepare` 접두사를 사용한다.
 *
 * 주의: 필수 params(예: `{ id: string }`)를 등록하면 패키지 내부 소스
 * (`stackflow.tsx`의 ActivityComponentMapProvider, `useStepFlow.ts`)의
 * variance 검사가 깨져 typecheck가 영구히 실패하므로, in-package spec에서는
 * 옵셔널 params만 사용한다.
 */
declare module "@stackflow/config" {
  interface Register {
    PrepareActivityA: { id?: string };
    PrepareActivityB: { id?: string };
    PrepareHomeActivity: {};
    PrepareStructuredActivity: {};
  }
}

type ActivityModule = { default: () => JSX.Element };

/** 제어 가능한 비동기 작업 */
function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
} {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** 매크로태스크 한 턴을 대기해 그 시점까지 쌓인 마이크로태스크를 모두 비운다. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * pending 검사: then-플래그 + 마이크로태스크 flush.
 * Promise 내부 구조에 의존하지 않는다.
 */
async function isSettled(p: Promise<unknown>): Promise<boolean> {
  let settled = false;
  p.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  await flushMicrotasks();
  return settled;
}

/**
 * 인라인 렌더러 플러그인 — `@stackflow/plugin-renderer-basic`은 워크스페이스
 * 순환 의존이라 사용할 수 없다.
 */
const testRendererPlugin: StackflowReactPlugin = () => ({
  key: "test-renderer",
  render({ stack }) {
    return (
      <>
        {stack.render().activities.map((activity) => (
          <React.Fragment key={activity.key}>
            {activity.render()}
          </React.Fragment>
        ))}
      </>
    );
  },
});

/**
 * Suspense 래핑 변형 — pending chunk의 lazy 컴포넌트를 마운트하는 테스트는
 * 렌더가 suspend하므로 `<React.Suspense fallback>`으로 감싼다.
 */
const suspenseTestRendererPlugin: StackflowReactPlugin = () => ({
  key: "test-renderer",
  render({ stack }) {
    return (
      <React.Suspense fallback={<div>suspense-fallback</div>}>
        {stack.render().activities.map((activity) => (
          <React.Fragment key={activity.key}>
            {activity.render()}
          </React.Fragment>
        ))}
      </React.Suspense>
    );
  },
});

function PlainActivity() {
  return <div>plain</div>;
}

/**
 * `Register`에 등록된 모든 이름은 `stackflow()`의 `components`에 키로 존재해야
 * 하므로(증강이 전역 병합되는 데 따른 타입 제약), 모든 호출은 이 기본 맵을
 * 스프레드한 뒤 테스트 대상 항목만 덮어쓴다.
 */
const baseComponents = {
  PrepareActivityA: PlainActivity,
  PrepareActivityB: PlainActivity,
  PrepareHomeActivity: PlainActivity,
  PrepareStructuredActivity: PlainActivity,
};

describe("prepare — stackflow() 출력", () => {
  describe("기본 규약 (렌더 없이 호출)", () => {
    it("params 생략 시 component chunk 로드만 발사하고 data loader는 호출하지 않는다", async () => {
      // given: loader와 lazy 컴포넌트(import jest.fn)가 설정된 activity
      const loader = jest.fn(() => ({ data: "x" }));
      const importFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>A content</div> }),
      );
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA", loader }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: params 없이 호출한다
      await prepare("PrepareActivityA");

      // then: import 함수는 호출되고, loader는 호출되지 않는다
      expect(importFn).toHaveBeenCalled();
      expect(loader).not.toHaveBeenCalled();
    });

    it("params 전달 시 chunk 로드와 data loader를 모두 발사한다", async () => {
      // given: loader + lazy 컴포넌트(import jest.fn)인 activity
      const loader = jest.fn(() => ({ data: "x" }));
      const importFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>A content</div> }),
      );
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA", loader }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: params를 전달해 호출한다
      await prepare("PrepareActivityA", { id: "1" });

      // then: loader가 공개 타입 ActivityLoaderArgs({ params, config }) 형태의
      //       인자로 호출되고, import 함수도 호출된다
      expect(loader).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: "1" },
          config: expect.anything(),
        }),
      );
      expect(importFn).toHaveBeenCalled();
    });

    it("loader가 없는 activity에 params를 전달해도 에러 없이 resolve된다", async () => {
      // given: loader 없는 config + lazy 컴포넌트
      const importFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>A content</div> }),
      );
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: params를 전달해 호출한다
      const p = prepare("PrepareActivityA", { id: "1" });

      // then: 반환 Promise가 에러 없이 resolve된다 (chunk 발사 검증은 위 테스트들의 규약)
      await expect(p).resolves.toBeUndefined();
    });

    it("lazy도 structured도 아닌 일반 컴포넌트는 아무 작업도 발사하지 않고 resolve된다", async () => {
      // given: 일반 함수 컴포넌트, loader 없는 activity
      const config = defineConfig({
        activities: [{ name: "PrepareHomeActivity" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents },
      });

      // when: 호출한다
      const p = prepare("PrepareHomeActivity");

      // then: 반환 Promise가 에러 없이 resolve된다
      await expect(p).resolves.toBeUndefined();
    });

    it("structuredActivityComponent의 dynamic content는 content import를 발사한다", async () => {
      // given: content가 dynamic import 함수인 structured component
      const contentImportFn = jest.fn(() =>
        Promise.resolve({
          default: content<"PrepareStructuredActivity">(() => (
            <div>structured content</div>
          )),
        }),
      );
      const config = defineConfig({
        activities: [{ name: "PrepareStructuredActivity" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareStructuredActivity:
            structuredActivityComponent<"PrepareStructuredActivity">({
              content: contentImportFn,
            }),
        },
      });

      // when: 호출한다
      await prepare("PrepareStructuredActivity");

      // then: content import 함수가 호출된다
      expect(contentImportFn).toHaveBeenCalled();
    });

    it("structuredActivityComponent의 정적 content는 추가 로드 없이 resolve된다", async () => {
      // given: content가 함수가 아닌 정적 값인 structured component
      const config = defineConfig({
        activities: [{ name: "PrepareStructuredActivity" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareStructuredActivity:
            structuredActivityComponent<"PrepareStructuredActivity">({
              content: content<"PrepareStructuredActivity">(() => (
                <div>structured content</div>
              )),
            }),
        },
      });

      // when: 호출한다
      const p = prepare("PrepareStructuredActivity");

      // then: 반환 Promise가 에러 없이 resolve된다
      //       (동적 import 함수가 없으므로 호출 검증 대상도 없음)
      await expect(p).resolves.toBeUndefined();
    });

    it("미등록 activity 이름으로 호출하면 `Activity <name> is not registered.` 에러로 reject된다", async () => {
      // given: 등록된 activity만 있는 stackflow 인스턴스
      const config = defineConfig({
        activities: [{ name: "PrepareHomeActivity" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents },
      });

      // when: 미등록 이름으로 호출한다 (타입은 prepare.types.spec.tsx가 컴파일
      //       타임에 차단하므로 런타임 테스트는 as any로 우회한다)
      //       동기 throw라면 이 줄에서 테스트가 실패하므로, 아래 단언이
      //       "throw가 아닌 reject" 계약을 함께 고정한다
      const p = prepare("Unknown" as any);

      // then: 해당 메시지의 Error로 reject된다
      await expect(p).rejects.toThrow("Activity Unknown is not registered.");
    });

    it('빈 객체 params도 "params 전달"로 취급되어 loader가 호출된다', async () => {
      // given: 파라미터가 없는({} 타입) activity + loader
      const loader = jest.fn(() => ({ data: "x" }));
      const config = defineConfig({
        activities: [{ name: "PrepareHomeActivity", loader }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents },
      });

      // when: 빈 객체 params로 호출한다
      await prepare("PrepareHomeActivity", {});

      // then: loader가 호출된다 (params를 생략한 경우와 달리)
      expect(loader).toHaveBeenCalled();
    });
  });

  describe("반환 Promise 의미 — 모든 작업 완료 시에만 resolve", () => {
    it("chunk 로드가 완료되기 전에는 resolve되지 않고, 완료되면 resolve된다", async () => {
      // given: deferred로 제어되는 lazy import 함수
      const chunkDeferred = createDeferred<ActivityModule>();
      const importFn = jest.fn(() => chunkDeferred.promise);
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: 호출 후 마이크로태스크를 flush한다
      const p = prepare("PrepareActivityA");

      // then: 아직 settle되지 않았다
      expect(await isSettled(p)).toBe(false);

      // when: chunk 로드를 완료한다
      chunkDeferred.resolve({ default: () => <div>A content</div> });

      // then: resolve된다
      await expect(p).resolves.toBeUndefined();
    });

    it("loader만 완료되고 chunk가 미완료인 동안에는 resolve되지 않는다 (중간 상태 미노출)", async () => {
      // given: loader와 lazy import 각각을 제어하는 deferred 2개
      const loaderDeferred = createDeferred<{ data: string }>();
      const chunkDeferred = createDeferred<ActivityModule>();
      const loader = jest.fn(() => loaderDeferred.promise);
      const importFn = jest.fn(() => chunkDeferred.promise);
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA", loader }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: 호출 후 loader만 완료한다
      const p = prepare("PrepareActivityA", { id: "1" });
      loaderDeferred.resolve({ data: "loaded" });

      // then: 여전히 pending이다
      expect(await isSettled(p)).toBe(false);

      // when: chunk 로드도 완료한다
      chunkDeferred.resolve({ default: () => <div>A content</div> });

      // then: resolve된다
      await expect(p).resolves.toBeUndefined();
    });

    it("chunk만 완료되고 loader가 미완료인 동안에는 resolve되지 않는다", async () => {
      // given: loader와 lazy import 각각을 제어하는 deferred 2개 (위 테스트의 대칭)
      const loaderDeferred = createDeferred<{ data: string }>();
      const chunkDeferred = createDeferred<ActivityModule>();
      const loader = jest.fn(() => loaderDeferred.promise);
      const importFn = jest.fn(() => chunkDeferred.promise);
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA", loader }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: 호출 후 chunk만 완료한다
      const p = prepare("PrepareActivityA", { id: "1" });
      chunkDeferred.resolve({ default: () => <div>A content</div> });

      // then: 여전히 pending이다
      expect(await isSettled(p)).toBe(false);

      // when: loader도 완료한다
      loaderDeferred.resolve({ data: "loaded" });

      // then: resolve된다
      await expect(p).resolves.toBeUndefined();
    });
  });

  describe("React 밖 / 렌더 전 호출 가능성", () => {
    it("<Stack> 렌더 없이(React 트리 부재) prepare가 완전한 동작을 한다", async () => {
      // given: stackflow() 호출 직후, 어떤 컴포넌트도 렌더하지 않은 상태
      //        (loader + lazy activity)
      const loader = jest.fn(() => ({ data: "x" }));
      const importFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>A content</div> }),
      );
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA", loader }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: 렌더 없이 호출한다
      await prepare("PrepareActivityA", { id: "1" });

      // then: loader와 import 함수가 모두 호출된다
      expect(loader).toHaveBeenCalled();
      expect(importFn).toHaveBeenCalled();
    });

    it("렌더 전 prepare 호출이 이후 <Stack> 마운트를 방해하지 않는다", async () => {
      // given: lazy activity에 대한 prepare 완료, initialActivity는 일반 컴포넌트
      function HomeActivity() {
        return <div>home</div>;
      }
      const importFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>A content</div> }),
      );
      const config = defineConfig({
        activities: [
          { name: "PrepareHomeActivity" },
          { name: "PrepareActivityA" },
        ],
        transitionDuration: 0,
        initialActivity: () => "PrepareHomeActivity",
      });
      const { Stack, prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareHomeActivity: HomeActivity,
          PrepareActivityA: lazy(importFn),
        },
        plugins: [testRendererPlugin],
      });
      await prepare("PrepareActivityA");

      // when: <Stack>을 마운트한다
      render(<Stack />);

      // then: 초기 activity가 정상 렌더된다
      expect(screen.getByText("home")).toBeTruthy();
    });
  });

  describe("동시성 · 경쟁 상태 · 실패", () => {
    it("동일 activity에 대한 동시 중복 prepare — 두 Promise 모두 작업 완료 후 각각 resolve된다", async () => {
      // given: deferred chunk를 가진 lazy activity. import 함수는 호출마다
      //        동일한 deferred.promise를 반환한다 — 구현이 디듀프하든 안 하든
      //        테스트 결과가 같도록(디듀프-불가지 픽스처)
      const chunkDeferred = createDeferred<ActivityModule>();
      const importFn = jest.fn(() => chunkDeferred.promise);
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: 동시에 두 번 호출한다
      const p1 = prepare("PrepareActivityA");
      const p2 = prepare("PrepareActivityA");

      // then: 둘 다 pending이다
      expect(await isSettled(p1)).toBe(false);
      expect(await isSettled(p2)).toBe(false);

      // when: chunk 로드를 완료한다
      chunkDeferred.resolve({ default: () => <div>A content</div> });

      // then: 두 Promise 모두 resolve된다
      //       (import 함수/loader의 호출 횟수는 계약이 아니므로 단언하지 않는다)
      await expect(p1).resolves.toBeUndefined();
      await expect(p2).resolves.toBeUndefined();
    });

    it("서로 다른 activity의 동시 prepare는 서로 간섭하지 않는다", async () => {
      // given: 각각 deferred chunk를 가진 lazy activity 2개
      const chunkADeferred = createDeferred<ActivityModule>();
      const chunkBDeferred = createDeferred<ActivityModule>();
      const importAFn = jest.fn(() => chunkADeferred.promise);
      const importBFn = jest.fn(() => chunkBDeferred.promise);
      const config = defineConfig({
        activities: [
          { name: "PrepareActivityA" },
          { name: "PrepareActivityB" },
        ],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareActivityA: lazy(importAFn),
          PrepareActivityB: lazy(importBFn),
        },
      });

      // when: 둘을 동시에 호출한 뒤 B의 chunk만 완료한다
      const pA = prepare("PrepareActivityA");
      const pB = prepare("PrepareActivityB");
      chunkBDeferred.resolve({ default: () => <div>B content</div> });

      // then: pB는 resolve되고 pA는 여전히 pending이다
      await expect(pB).resolves.toBeUndefined();
      expect(await isSettled(pA)).toBe(false);

      // when: A의 chunk도 완료한다
      chunkADeferred.resolve({ default: () => <div>A content</div> });

      // then: pA도 resolve된다
      await expect(pA).resolves.toBeUndefined();
    });

    it("prepare 진행 중 같은 activity로 push가 발생해도 push는 정상 완료된다", async () => {
      // given: <Stack> 렌더(initial: 일반 Home), deferred chunk의 lazy activity,
      //        spy 플러그인(getStack), 미완료 prepare 발사
      let getStack!: () => CoreStack;
      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });
      function HomeActivity() {
        return <div>home</div>;
      }
      const chunkDeferred = createDeferred<ActivityModule>();
      const importFn = jest.fn(() => chunkDeferred.promise);
      const config = defineConfig({
        activities: [
          { name: "PrepareHomeActivity" },
          { name: "PrepareActivityA" },
        ],
        transitionDuration: 0,
        initialActivity: () => "PrepareHomeActivity",
      });
      const { Stack, actions, prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareHomeActivity: HomeActivity,
          PrepareActivityA: lazy(importFn),
        },
        plugins: [testRendererPlugin, spyPlugin],
      });
      render(<Stack />);
      const activitiesBefore = getStack().activities;
      const p = prepare("PrepareActivityA");

      // when: 같은 activity로 push한 뒤 chunk를 완료하고 settle을 기다린다
      await act(async () => {
        actions.push("PrepareActivityA", {});
      });
      await act(async () => {
        chunkDeferred.resolve({ default: () => <div>A content</div> });
        await p;
        await flushMicrotasks();
      });

      // then: 스택이 기존 + 1개가 되고 top이 해당 activity다
      const activities = getStack().activities;
      expect(activities).toHaveLength(activitiesBefore.length + 1);
      expect(activities[activities.length - 1].name).toBe("PrepareActivityA");
      expect(activities[activities.length - 1].enteredBy.name).toBe("Pushed");
    });

    it("prepare 진행 중 <Stack> 마운트(부트스트랩 시나리오)도 정상 동작한다", async () => {
      // given: deferred chunk의 lazy activity(loader 없음)가 initialActivity,
      //        Suspense 래핑 인라인 렌더러, prepare 발사 직후(미완료)
      const chunkDeferred = createDeferred<ActivityModule>();
      const importFn = jest.fn(() => chunkDeferred.promise);
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA" }],
        transitionDuration: 0,
        initialActivity: () => "PrepareActivityA",
      });
      const { Stack, prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
        plugins: [suspenseTestRendererPlugin],
      });
      const p = prepare("PrepareActivityA");

      // when: <Stack>을 마운트한 뒤 chunk를 완료하고 settle을 기다린다
      render(<Stack />);
      await act(async () => {
        chunkDeferred.resolve({ default: () => <div>A content</div> });
        await p;
        await flushMicrotasks();
      });

      // then: 해당 activity의 콘텐츠가 렌더된다
      expect(await screen.findByText("A content")).toBeTruthy();
    });

    it("loader가 동기 throw하면 반환 Promise는 해당 에러로 reject된다", async () => {
      // given: 동기 throw하는 loader인 activity (+ lazy 컴포넌트)
      const err = new Error("loader sync throw");
      const loader = jest.fn(() => {
        throw err;
      });
      const importFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>A content</div> }),
      );
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA", loader }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: params와 함께 호출한다 (동기 throw로 전파된다면 이 줄에서 실패한다)
      const p = prepare("PrepareActivityA", { id: "1" });

      // then: 해당 에러로 reject된다
      //       (부분 발사 원자성은 계약이 아니므로 chunk 발사 여부는 단언하지 않는다)
      await expect(p).rejects.toBe(err);
    });

    it("loader가 비동기 reject하면 반환 Promise는 해당 reason으로 reject된다", async () => {
      // given: reject하는 loader인 activity
      const err = new Error("loader async reject");
      const loader = jest.fn(() => Promise.reject(err));
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA", loader }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents },
      });

      // when: params와 함께 호출한다
      const p = prepare("PrepareActivityA", { id: "1" });

      // then: 해당 reason으로 reject된다
      await expect(p).rejects.toBe(err);
    });

    it("chunk 로드가 reject하면 반환 Promise는 해당 reason으로 reject된다", async () => {
      // given: import가 reject하는 lazy activity
      const err = new Error("chunk load failed");
      const importFn = jest.fn(() => Promise.reject<ActivityModule>(err));
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // when: 호출한다
      const p = prepare("PrepareActivityA");

      // then: 해당 reason으로 reject된다
      await expect(p).rejects.toBe(err);
    });

    it("chunk 로드 실패 후 같은 activity를 다시 prepare하면 로드를 재시도한다", async () => {
      // given: 첫 호출은 reject, 두 번째 호출은 resolve하는 lazy import
      const err = new Error("chunk load failed");
      const importFn = jest
        .fn<Promise<ActivityModule>, []>()
        .mockRejectedValueOnce(err)
        .mockResolvedValueOnce({ default: () => <div>A content</div> });
      const config = defineConfig({
        activities: [{ name: "PrepareActivityA" }],
        transitionDuration: 0,
      });
      const { prepare } = stackflow({
        config,
        components: { ...baseComponents, PrepareActivityA: lazy(importFn) },
      });

      // given: 첫 prepare의 reject를 확인한다
      await expect(prepare("PrepareActivityA")).rejects.toBe(err);

      // when: 같은 activity를 다시 prepare한다
      const p2 = prepare("PrepareActivityA");

      // then: import 함수가 다시 호출되고(총 2회) p2는 resolve된다
      //       (재호출이 곧 "재시도" 계약의 직접 관찰이다 — 캐시된 실패가
      //       반환되면 p2가 reject되어 구분된다)
      await expect(p2).resolves.toBeUndefined();
      expect(importFn).toHaveBeenCalledTimes(2);
    });

    it("prepare 실패가 이후 내비게이션과 다른 prepare를 오염시키지 않는다 (오류 격리 invariant)", async () => {
      // given: loader가 reject하는 A, 정상 lazy + loader의 B,
      //        <Stack> 렌더 + spy 플러그인
      let getStack!: () => CoreStack;
      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
      });
      function HomeActivity() {
        return <div>home</div>;
      }
      const err = new Error("A loader failed");
      const loaderA = jest.fn(() => Promise.reject(err));
      const loaderB = jest.fn(() => ({ data: "b" }));
      const importBFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>B content</div> }),
      );
      const config = defineConfig({
        activities: [
          { name: "PrepareHomeActivity" },
          { name: "PrepareActivityA", loader: loaderA },
          { name: "PrepareActivityB", loader: loaderB },
        ],
        transitionDuration: 0,
        initialActivity: () => "PrepareHomeActivity",
      });
      const { Stack, actions, prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareHomeActivity: HomeActivity,
          PrepareActivityB: lazy(importBFn),
        },
        plugins: [testRendererPlugin, spyPlugin],
      });
      render(<Stack />);

      // given: A에 대한 prepare의 reject를 확인한다
      await expect(prepare("PrepareActivityA", { id: "a" })).rejects.toBe(err);

      // when: B를 prepare한 뒤 B로 push한다
      const pB = prepare("PrepareActivityB", { id: "b" });

      // then: B의 prepare는 resolve된다
      await expect(pB).resolves.toBeUndefined();

      // when: B로 push한다
      await act(async () => {
        actions.push("PrepareActivityB", { id: "b" });
        await flushMicrotasks();
      });

      // then: 스택 top이 B다
      const activities = getStack().activities;
      expect(activities[activities.length - 1].name).toBe("PrepareActivityB");
    });

    it("prepare는 스택 상태를 변경하지 않으며 내비게이션 이벤트를 발생시키지 않는다", async () => {
      // given: <Stack> 렌더, spy 플러그인(getStack + onChanged/onBeforePush/onPushed
      //        기록), loader + lazy의 activity
      let getStack!: () => CoreStack;
      const onChanged = jest.fn();
      const onBeforePush = jest.fn();
      const onPushed = jest.fn();
      const spyPlugin: StackflowReactPlugin = () => ({
        key: "spy",
        onInit({ actions }) {
          getStack = actions.getStack;
        },
        onChanged,
        onBeforePush,
        onPushed,
      });
      function HomeActivity() {
        return <div>home</div>;
      }
      const loader = jest.fn(() => ({ data: "x" }));
      const importFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>A content</div> }),
      );
      const config = defineConfig({
        activities: [
          { name: "PrepareHomeActivity" },
          { name: "PrepareActivityA", loader },
        ],
        transitionDuration: 0,
        initialActivity: () => "PrepareHomeActivity",
      });
      const { Stack, prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareHomeActivity: HomeActivity,
          PrepareActivityA: lazy(importFn),
        },
        plugins: [testRendererPlugin, spyPlugin],
      });
      render(<Stack />);

      // given: 스택 스냅샷과 훅 호출 횟수를 채취한다
      const activitiesBefore = getStack().activities;
      const onChangedCallsBefore = onChanged.mock.calls.length;
      const onBeforePushCallsBefore = onBeforePush.mock.calls.length;
      const onPushedCallsBefore = onPushed.mock.calls.length;

      // when: prepare를 완료한 뒤 재채취한다
      await prepare("PrepareActivityA", { id: "1" });
      await flushMicrotasks();

      // then: 스택이 prepare 전후 동등하고, 기록된 플러그인 훅이 prepare로
      //       인해 추가 호출되지 않았다 (두 단언 모두 "core store 미접촉"이라는
      //       단일 규약의 관찰 지점이다)
      expect(getStack().activities).toEqual(activitiesBefore);
      expect(onChanged.mock.calls.length).toBe(onChangedCallsBefore);
      expect(onBeforePush.mock.calls.length).toBe(onBeforePushCallsBefore);
      expect(onPushed.mock.calls.length).toBe(onPushedCallsBefore);
    });
  });

  describe("loaderPlugin과의 책임 분리", () => {
    // 주의: 이 절은 호출 횟수를 단언하지 않는다. loader 디듀프·chunk 중복 발사
    // 여부는 계약이 아니며, 여기서는 "prepare가 기존 내비게이션 경로
    // (loaderData 주입·lazy 렌더)를 방해하지 않는다"는 책임 분리만 검증한다.

    it("prepare 후 push해도 loaderData 주입은 loaderPlugin 경로로 정상 동작한다", async () => {
      // given: 동기 데이터를 반환하는 loader의 activity,
      //        해당 컴포넌트는 useLoaderData() 값을 렌더. <Stack> 렌더(initial: Home)
      function HomeActivity() {
        return <div>home</div>;
      }
      const loader = jest.fn(() => ({ message: "loaded" }));
      function ActivityAWithLoaderData() {
        const data = useLoaderData<() => { message: string }>();
        return <div>{data.message}</div>;
      }
      const config = defineConfig({
        activities: [
          { name: "PrepareHomeActivity" },
          { name: "PrepareActivityA", loader },
        ],
        transitionDuration: 0,
        initialActivity: () => "PrepareHomeActivity",
      });
      const { Stack, actions, prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareHomeActivity: HomeActivity,
          PrepareActivityA: ActivityAWithLoaderData,
        },
        plugins: [testRendererPlugin],
      });
      render(<Stack />);

      // when: prepare를 완료한 뒤 push하고 settle을 기다린다
      await prepare("PrepareActivityA", { id: "1" });
      await act(async () => {
        actions.push("PrepareActivityA", { id: "1" });
        await flushMicrotasks();
      });

      // then: activity가 loader 데이터와 함께 렌더된다 — prepare가 loaderData
      //       주입 경로를 가로채거나 망가뜨리지 않는다
      expect(await screen.findByText("loaded")).toBeTruthy();
    });

    it("prepare 완료 후 push하면 lazy activity가 정상 렌더된다", async () => {
      // given: resolve되는 lazy의 activity, <Stack> 렌더(initial: Home)
      function HomeActivity() {
        return <div>home</div>;
      }
      const importFn = jest.fn(() =>
        Promise.resolve({ default: () => <div>A content</div> }),
      );
      const config = defineConfig({
        activities: [
          { name: "PrepareHomeActivity" },
          { name: "PrepareActivityA" },
        ],
        transitionDuration: 0,
        initialActivity: () => "PrepareHomeActivity",
      });
      const { Stack, actions, prepare } = stackflow({
        config,
        components: {
          ...baseComponents,
          PrepareHomeActivity: HomeActivity,
          PrepareActivityA: lazy(importFn),
        },
        plugins: [testRendererPlugin],
      });
      render(<Stack />);

      // when: prepare를 완료한 뒤 push하고 settle을 기다린다
      await prepare("PrepareActivityA");
      await act(async () => {
        actions.push("PrepareActivityA", {});
        await flushMicrotasks();
      });

      // then: activity의 콘텐츠가 렌더된다 — 워밍된 chunk가 이후 내비게이션
      //       렌더를 방해하지 않는다
      //       (import 호출 횟수는 계약이 아니므로 단언하지 않는다)
      expect(await screen.findByText("A content")).toBeTruthy();
    });
  });
});

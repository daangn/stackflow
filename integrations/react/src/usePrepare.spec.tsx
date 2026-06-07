/**
 * `usePrepare` 래퍼 동등성
 *
 * `usePrepare`는 stackflow() 출력 `prepare`와 동일 로직을 감싸는 얇은 래퍼다.
 * 반환 함수는 prepare.spec.tsx가 고정한 것과 동일한 관찰 결과(chunk + loader
 * 발사, 미등록 activity reject)를 보여야 한다.
 * 이 파일은 현행 동작 기준이므로 prepare 구현 이전에도 green이어야 한다.
 *
 * import는 public entry(`./index`)에서만 한다 — 패키지명 import는 dist(빌드
 * 산출물)를 가리킨다.
 */
import { defineConfig } from "@stackflow/config";
import { render } from "@testing-library/react";
import React from "react";
import type { Prepare, StackflowReactPlugin } from "./index";
import { lazy, stackflow, usePrepare } from "./index";

/**
 * `Register` 증강은 패키지 전역으로 병합된다 — prepare.spec.tsx와 동일한
 * 멤버의 재선언이다(동일 타입 재선언은 declaration merging으로 허용된다).
 */
declare module "@stackflow/config" {
  interface Register {
    PrepareActivityA: { id?: string };
    PrepareActivityB: { id?: string };
    PrepareHomeActivity: {};
    PrepareStructuredActivity: {};
  }
}

/** 인라인 렌더러 플러그인 — plugin-renderer-basic은 워크스페이스 순환 의존 */
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

function PlainActivity() {
  return <div>plain</div>;
}

/** Register에 등록된 모든 이름은 components에 키로 존재해야 한다. */
const baseComponents = {
  PrepareActivityA: PlainActivity,
  PrepareActivityB: PlainActivity,
  PrepareHomeActivity: PlainActivity,
  PrepareStructuredActivity: PlainActivity,
};

describe("usePrepare — 래퍼 동등성", () => {
  it("usePrepare가 반환한 함수도 chunk + data를 동일하게 발사한다", async () => {
    // given: <Stack> 렌더 — 초기 activity 내부에서 usePrepare() 반환값을
    //        외부 변수로 캡처. 별도의 lazy + loader activity B.
    let capturedPrepare!: Prepare;
    function HomeActivity() {
      capturedPrepare = usePrepare();
      return <div>home</div>;
    }
    const loader = jest.fn(() => ({ data: "b" }));
    const importFn = jest.fn(() =>
      Promise.resolve({ default: () => <div>B content</div> }),
    );
    const config = defineConfig({
      activities: [
        { name: "PrepareHomeActivity" },
        { name: "PrepareActivityB", loader },
      ],
      transitionDuration: 0,
      initialActivity: () => "PrepareHomeActivity",
    });
    const { Stack } = stackflow({
      config,
      components: {
        ...baseComponents,
        PrepareHomeActivity: HomeActivity,
        PrepareActivityB: lazy(importFn),
      },
      plugins: [testRendererPlugin],
    });
    render(<Stack />);

    // when: 캡처한 함수로 params와 함께 호출한다
    await capturedPrepare("PrepareActivityB", { id: "1" });

    // then: loader가 params 인자로 호출되고, import 함수가 호출된다
    //       — stackflow() 출력 prepare와 동일한 관찰 결과
    expect(loader).toHaveBeenCalledWith(
      expect.objectContaining({ params: { id: "1" } }),
    );
    expect(importFn).toHaveBeenCalled();
  });

  it("usePrepare가 반환한 함수도 미등록 activity에 동일 에러로 reject된다", async () => {
    // given: 초기 activity 내부에서 usePrepare() 반환값을 외부 변수로 캡처
    let capturedPrepare!: Prepare;
    function HomeActivity() {
      capturedPrepare = usePrepare();
      return <div>home</div>;
    }
    const config = defineConfig({
      activities: [{ name: "PrepareHomeActivity" }],
      transitionDuration: 0,
      initialActivity: () => "PrepareHomeActivity",
    });
    const { Stack } = stackflow({
      config,
      components: { ...baseComponents, PrepareHomeActivity: HomeActivity },
      plugins: [testRendererPlugin],
    });
    render(<Stack />);

    // when: 미등록 이름으로 호출한다 (타입은 prepare.types.spec.tsx가 컴파일
    //       타임에 차단하므로 런타임 테스트는 as any로 우회한다)
    const p = capturedPrepare("Unknown" as any);

    // then: stackflow() 출력 prepare와 동일한 에러로 reject된다
    await expect(p).rejects.toThrow("Activity Unknown is not registered.");
  });
});

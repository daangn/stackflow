/**
 * `prepare` 타입 안전성
 *
 * 잘못된 activity 이름·파라미터는 컴파일 타임에 차단되어야 한다
 * (`RegisteredActivityName` · `InferActivityParams<K>` 제네릭 흐름).
 *
 * - 타입 단언은 `yarn workspace @stackflow/react typecheck`(tsconfig.test.json)로
 *   검증된다. 모두 절대 호출되지 않는 함수 본문 안에 배치한다
 *   (@swc/jest는 타입을 검사하지 않으므로 런타임 실행을 막기 위함).
 * - `@ts-expect-error`는 "다음 줄에 컴파일 에러가 있어야 통과" 시맨틱이므로,
 *   규약이 깨지면 typecheck가 실패한다.
 * - Jest는 spec 파일에 최소 1개 테스트를 요구하므로 런타임 항목(출력 형태
 *   확인)을 이 파일에 함께 둔다.
 * - import는 public entry(`./index`)에서만 한다 — 패키지명 import는 dist(빌드
 *   산출물)를 가리킨다.
 *
 * [TDD 상태 주의] `prepare`가 stackflow() 출력에 아직 없으므로, 이 파일은
 * 구현 전까지 `output.prepare` 접근(TS2339)과 그에 따른 `@ts-expect-error`
 * 미발동(TS2578)으로 typecheck가 실패한다 — 모두 prepare 부재가 단일
 * 원인이며, 구현이 들어오면 전부 green이 되어야 한다.
 */
import { defineConfig } from "@stackflow/config";
import type { Prepare, usePrepare } from "./index";
import { stackflow } from "./index";

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

const config = defineConfig({
  activities: [{ name: "PrepareActivityA" }],
  transitionDuration: 0,
});

const output = stackflow({
  config,
  components: baseComponents,
});

describe("prepare — 출력 형태", () => {
  it("stackflow() 출력에 prepare 함수가 포함된다", () => {
    // given: defineConfig + components로 stackflow()를 호출한다 (모듈 상단 픽스처)
    // when: 반환 객체를 확인한다
    // then: prepare가 함수다
    expect(typeof output.prepare).toBe("function");
  });
});

// --- 타입 안전성 ---
// 아래 함수들은 typecheck 전용이며 절대 호출되지 않는다.

/** 미등록 activity 이름은 컴파일 에러다 */
function _typecheckUnregisteredActivityName() {
  // @ts-expect-error Register에 증강되지 않은 이름은 거부된다
  output.prepare("NotRegistered");
}

/** 잘못된 params 타입은 컴파일 에러다 */
function _typecheckInvalidParams() {
  // @ts-expect-error params 값 타입 불일치(string 자리에 number)는 거부된다
  output.prepare("PrepareActivityA", { id: 123 });
  // @ts-expect-error 정의되지 않은 params 키는 거부된다
  output.prepare("PrepareActivityA", { wrong: "x" });
}

/** params는 생략 가능하고 반환 타입은 Promise<void>다 */
function _typecheckOptionalParamsAndReturnType() {
  const r1: Promise<void> = output.prepare("PrepareActivityA");
  const r2: Promise<void> = output.prepare("PrepareActivityA", { id: "1" });
  return [r1, r2];
}

/**
 * stackflow() 출력 prepare와 usePrepare 반환값은 모두 Prepare 타입과
 * 상호 할당 가능하다 — 두 진입점이 동일한 공개 시그니처를 공유한다
 */
function _typecheckPrepareTypeEquivalence(up: ReturnType<typeof usePrepare>) {
  // 정방향: 두 진입점 → Prepare
  const a: Prepare = output.prepare;
  const b: Prepare = up;
  // 역방향: Prepare → 두 진입점의 타입
  const c: ReturnType<typeof usePrepare> = a;
  const d: typeof output.prepare = b;
  return [a, b, c, d];
}

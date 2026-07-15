import { makeCoreStore } from "@stackflow/core";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useDeterministicClock, waitForCondition } from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import { freshEvents } from "./__fixtures__/stackFixtures";
import { makeStrategySpy } from "./__fixtures__/strategySpy";

type Metadata = { origin: string };

beforeEach(() => {
  useDeterministicClock();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("metadata 생성 성공은 snapshot·context와 하나의 record로 결합된다", () => {
  test("createMetadata는 저장 대상 core snapshot과 같은 context를 동기적으로 받고, storage는 그 반환값과 동일 snapshot이 결합된 record 전체를 한 번 받는다", async () => {
    // given: snapshot과 initialContext에서 고유 metadata를 만드는 strategy
    const initialContext = { tenant: "t-1" };
    const callLog: string[] = [];
    const returnedMetadata: Metadata[] = [];
    const controlled = makeControlledStorage<Metadata>({ callLog });
    const strategy = makeStrategySpy<Metadata>({
      callLog,
      createMetadata: ({ snapshot }) => {
        const metadata = { origin: `m-${snapshot.events.length}` };
        returnedMetadata.push(metadata);
        return metadata;
      },
      shouldReuse: () => true,
    });

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      initialContext,
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          strategy: strategy.strategy,
        }),
      ],
    });

    // when: Idle save가 발생한다
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "최초 Idle 자동 저장 요청",
    );

    // then: createMetadata의 입력은 저장 대상 snapshot과 같은 참조·같은 context다
    expect(strategy.createMetadataCalls).toHaveLength(1);
    expect(strategy.createMetadataCalls[0].snapshot).toBe(
      controlled.saveCalls[0].record.snapshot,
    );
    expect(strategy.createMetadataCalls[0].initialContext).toBe(initialContext);

    // then: 동기 결합 — save 전에 createMetadata가 이미 호출됐다
    expect(callLog.indexOf("strategy.createMetadata")).toBeLessThan(
      callLog.indexOf("storage.save"),
    );

    // then: storage는 반환값 그대로와 동일 snapshot이 결합된 record 전체를 한 번 받았다
    expect(controlled.saveCalls).toHaveLength(1);
    expect(controlled.saveCalls[0].record.metadata).toBe(returnedMetadata[0]);
  });
});

describe("fresh save 단계는 createMetadata만 호출한다", () => {
  test("record 없는 시작의 최초 자동 저장은 storage.load → createMetadata → storage.save 순서이며 shouldReuse는 호출되지 않는다", async () => {
    // given: load()가 null인 storage와 호출 순서를 기록하는 strategy, shouldReuse trap
    const callLog: string[] = [];
    const controlled = makeControlledStorage<Metadata>({ callLog });
    const strategy = makeStrategySpy<Metadata>({
      callLog,
      createMetadata: () => ({ origin: "m-fresh" }),
      shouldReuse: "forbidden",
    });

    // when: store를 생성하고 init()하여 최초 자동 저장 요청까지 관찰한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          strategy: strategy.strategy,
        }),
      ],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "최초 Idle 자동 저장 요청",
    );

    // then: 호출 순서와 횟수가 save 단계 전용성을 나타낸다
    expect(callLog).toEqual([
      "storage.load",
      "strategy.createMetadata",
      "storage.save",
    ]);
    expect(strategy.createMetadataCalls).toHaveLength(1);
    expect(strategy.shouldReuseCalls).toHaveLength(0);
  });
});

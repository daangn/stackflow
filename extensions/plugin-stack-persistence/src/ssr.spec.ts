import { makeCoreStore } from "@stackflow/core";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  installBrowserGlobalTraps,
  logicalStackView,
  navigationOrderIds,
} from "./__fixtures__/assertions";
import {
  settleMicrotasks,
  useDeterministicClock,
  waitForCondition,
} from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import { makeObserverPlugin } from "./__fixtures__/observerPlugin";
import {
  deepFreeze,
  freshEvents,
  makeRecord,
  richSnapshot,
} from "./__fixtures__/stackFixtures";
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

describe("browser global 없이 같은 계약으로 동작한다", () => {
  test("window/document/location/storage API가 전혀 없는 process에서 create·load·Idle save가 같은 storage/strategy 호출과 Stack 결과를 내고, 환경 추측(sniffing) 접근이 한 번도 없다", async () => {
    // given: 접근 시 기록하고 throw하는 browser global trap
    const traps = installBrowserGlobalTraps();

    try {
      // when: create 경로
      const createStorage = makeControlledStorage();
      const createStore = makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [stackPersistencePlugin({ storage: createStorage.storage })],
      });
      createStore.init();
      await waitForCondition(
        () => createStorage.saveCalls.length >= 1,
        "create 경로의 최초 Idle 자동 저장 요청",
      );

      // when: load 경로
      const loadStorage = makeControlledStorage({
        initialRecord: makeRecord(richSnapshot(), undefined),
      });
      const loadStore = makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [stackPersistencePlugin({ storage: loadStorage.storage })],
      });
      loadStore.init();
      await waitForCondition(
        () => loadStorage.saveCalls.length >= 1,
        "load 경로의 최초 Idle 자동 저장 요청",
      );

      // then: 주입된 계약만으로 같은 결과 — load 한 번씩, Idle save 한 번씩
      expect(createStorage.loadCallCount).toBe(1);
      expect(loadStorage.loadCallCount).toBe(1);
      expect(
        createStore.actions.getStack().activities.map((a) => a.id),
      ).toEqual(["fresh-home-1"]);
      expect(navigationOrderIds(loadStore.actions.getStack())).toEqual([
        "rich-home-1",
        "rich-article-1",
      ]);

      // then: 환경 추측이나 global 접근이 전혀 없다 — typeof sniffing도 기록된다
      expect(traps.touched).toEqual([]);
    } finally {
      traps.uninstall();
    }
  });
});

describe("준비된 record/context의 server-client 재사용 결정은 일치한다", () => {
  test("동일한 immutable record·initialContext·deterministic strategy를 받은 server-like와 client-like store는 같은 shouldReuse 입력·결정·최초 Stack을 낸다", () => {
    // given: 서버가 렌더링 전에 준비한 것과 같은 공유 입력
    const sharedRecord = makeRecord(richSnapshot(), { origin: "m-shared" });
    const sharedContext = deepFreeze({ url: "/articles/a-1" });

    const startRuntime = () => {
      const controlled = makeControlledStorage<Metadata>({
        initialRecord: sharedRecord,
      });
      const strategy = makeStrategySpy<Metadata>({
        createMetadata: () => ({ origin: "m-next" }),
        shouldReuse: ({ record }) => record.metadata.origin === "m-shared",
      });
      const store = makeCoreStore({
        initialEvents: freshEvents(),
        initialContext: sharedContext,
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
            strategy: strategy.strategy,
          }),
        ],
      });
      return { strategy, store };
    };

    // when: server-like와 client-like가 각각 시작한다
    const serverLike = startRuntime();
    const clientLike = startRuntime();

    // then: shouldReuse 입력이 같은 참조이고 결정과 최초 Stack이 같다
    expect(serverLike.strategy.shouldReuseCalls[0].record).toBe(sharedRecord);
    expect(clientLike.strategy.shouldReuseCalls[0].record).toBe(sharedRecord);
    expect(serverLike.strategy.shouldReuseCalls[0].initialContext).toBe(
      sharedContext,
    );
    expect(clientLike.strategy.shouldReuseCalls[0].initialContext).toBe(
      sharedContext,
    );

    const serverView = logicalStackView(serverLike.store.actions.getStack());
    const clientView = logicalStackView(clientLike.store.actions.getStack());
    expect(clientView).toEqual(serverView);
    expect(serverView.activities.map((a) => a.id)).toEqual([
      "rich-home-1",
      "rich-article-1",
    ]);
  });
});

describe("server write 금지는 no-op storage로 소비자가 결정한다", () => {
  test("save가 resolved Promise만 반환하는 no-op server storage에도 plugin은 정상 save 계약을 호출하며, server side effect는 storage가 만들지 않고 별도 server 분기가 필요 없다", async () => {
    // given: load는 준비 record를 반환하고 save는 아무것도 하지 않는 server storage
    const preparedRecord = makeRecord(richSnapshot(), undefined);
    const saveSpy = vi.fn(() => Promise.resolve());
    const noopServerStorage = {
      load: () => preparedRecord,
      save: saveSpy,
    };

    // when: load와 이후 Idle 변경을 수행한다 — 옵션은 브라우저 경우와 동일하다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: noopServerStorage })],
    });
    store.init();
    await waitForCondition(
      () => saveSpy.mock.calls.length >= 1,
      "복원된 Idle의 자동 저장 요청",
    );

    // then: 정상 save 계약이 호출됐고, side effect는 없다 — load 결과는 그대로다
    expect(saveSpy).toHaveBeenCalled();
    expect(noopServerStorage.load()).toBe(preparedRecord);
  });
});

describe("서로 다른 최초 record에 hydration 일치를 만들어내지 않는다", () => {
  test("server는 null, client는 snapshot record를 반환하면 각각 create와 load의 서로 다른 최초 Stack이 되고, 비동기 교체·병합·reconciliation이 일어나지 않는다", async () => {
    // given: 최초 record만 다른 server/client 설정
    const serverStorage = makeControlledStorage();
    const clientStorage = makeControlledStorage({
      initialRecord: makeRecord(richSnapshot(), undefined),
    });
    const serverObserver = makeObserverPlugin();
    const clientObserver = makeObserverPlugin();

    // when: 각각 최초 Stack을 만든다
    const serverStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({ storage: serverStorage.storage }),
        serverObserver.plugin,
      ],
    });
    serverStore.init();
    const clientStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({ storage: clientStorage.storage }),
        clientObserver.plugin,
      ],
    });
    clientStore.init();

    const serverView = logicalStackView(serverStore.actions.getStack());
    const clientView = logicalStackView(clientStore.actions.getStack());

    // then: 서로 다른 최초 Stack — server는 create, client는 load
    expect(serverObserver.initCalls[0].kind).toBe("create");
    expect(clientObserver.initCalls[0].kind).toBe("load");
    expect(serverView.activities.map((a) => a.id)).toEqual(["fresh-home-1"]);
    expect(clientView.activities.map((a) => a.id)).toEqual([
      "rich-home-1",
      "rich-article-1",
    ]);

    // then: 시간이 지나도 어느 쪽도 교체·병합되지 않는다
    await settleMicrotasks();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(logicalStackView(serverStore.actions.getStack())).toEqual(
      serverView,
    );
    expect(logicalStackView(clientStore.actions.getStack())).toEqual(
      clientView,
    );
    expect(serverStorage.loadCallCount).toBe(1);
    expect(clientStorage.loadCallCount).toBe(1);
  });
});

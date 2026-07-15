import type { StackSnapshot } from "@stackflow/core";
import { makeCoreStore, SnapshotLoadError } from "@stackflow/core";
import type { StackSnapshotStorage } from "@stackflow/plugin-stack-persistence";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  installBrowserGlobalTraps,
  logicalStackView,
  navigationOrderIds,
} from "./__fixtures__/assertions";
import {
  advanceUntilIdle,
  useDeterministicClock,
  waitForCondition,
} from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import { makeObserverPlugin } from "./__fixtures__/observerPlugin";
import {
  ARTICLE_ACTIVITY,
  freshEvents,
  invalidSchemaSnapshot,
  makeRecord,
  richSnapshot,
} from "./__fixtures__/stackFixtures";
import { makeStrategySpy } from "./__fixtures__/strategySpy";

beforeEach(() => {
  useDeterministicClock();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("저장 매체, codec, namespace는 주입된 storage의 책임이다", () => {
  test("plugin은 주입된 load/save만 사용하고 key·codec·매체 API를 요구하거나 해석하지 않는다 — metadata: undefined의 codec 왕복은 storage 쪽에서 닫힌다", async () => {
    // given: namespace/codec 로직을 내부에만 둔 storage와 browser global이 없는 환경
    const traps = installBrowserGlobalTraps();

    try {
      const medium = new Map<string, string>();
      const STORAGE_KEY = "stackflow:user-42:v7";

      const codecStorage: StackSnapshotStorage = {
        load() {
          const raw = medium.get(STORAGE_KEY);
          if (raw === undefined) {
            return null;
          }
          const decoded = JSON.parse(raw) as {
            snapshot: StackSnapshot;
            metadataAbsent: boolean;
          };
          // The medium cannot express `undefined`; the codec round-trips it.
          return { snapshot: decoded.snapshot, metadata: undefined };
        },
        save(record) {
          medium.set(
            STORAGE_KEY,
            JSON.stringify({
              snapshot: record.snapshot,
              metadataAbsent: record.metadata === undefined,
            }),
          );
          return Promise.resolve();
        },
      };

      const accessedProperties = new Set<string>();
      const trackedStorage = new Proxy(codecStorage, {
        get(target, property, receiver) {
          if (typeof property === "string") {
            accessedProperties.add(property);
          }
          return Reflect.get(target, property, receiver);
        },
        has(target, property) {
          if (typeof property === "string") {
            accessedProperties.add(property);
          }
          return Reflect.has(target, property);
        },
      });

      // when: 첫 실행이 저장하고 두 번째 실행이 복원한다
      const firstStore = makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [stackPersistencePlugin({ storage: trackedStorage })],
      });
      firstStore.init();
      await waitForCondition(
        () => medium.has(STORAGE_KEY),
        "codec storage에 인코딩된 record 기록",
      );

      const secondStore = makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [stackPersistencePlugin({ storage: trackedStorage })],
      });

      // then: 복원이 동작한다 — namespace/codec을 plugin이 몰라도 된다
      expect(logicalStackView(secondStore.actions.getStack())).toEqual(
        logicalStackView(firstStore.actions.getStack()),
      );

      // then (storage self-check): metadata: undefined가 codec 경계 너머로 왕복했다
      const roundTripped = codecStorage.load();
      if (roundTripped === null) {
        throw new Error(
          "codec storage self-check 실패: 저장 완료 후에도 load()가 null을 반환했습니다",
        );
      }
      expect(Object.hasOwn(roundTripped, "metadata")).toBe(true);
      expect(roundTripped.metadata).toBe(undefined);

      // then: plugin이 접근한 storage 표면은 load/save뿐이다
      expect(
        [...accessedProperties].filter(
          (property) => !["load", "save"].includes(property),
        ),
      ).toEqual([]);

      // then: 매체 API(browser storage global)를 요구하지 않았다
      expect(traps.touched).toEqual([]);
    } finally {
      traps.uninstall();
    }
  });
});

describe("한 options에는 storage와 strategy가 각각 하나이며 복합 정책을 중재하지 않는다", () => {
  test("정상 단일 조합은 하나의 storage/strategy만 사용한다", async () => {
    // given
    type Metadata = { origin: string };
    const controlled = makeControlledStorage<Metadata>({
      initialRecord: makeRecord(richSnapshot(), { origin: "m-1" }),
    });
    const strategy = makeStrategySpy<Metadata>({
      createMetadata: () => ({ origin: "m-next" }),
      shouldReuse: () => true,
    });

    // when
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
      "복원된 Idle의 자동 저장 요청",
    );

    // then: 주입된 한 쌍이 전 과정을 담당했다
    expect(controlled.loadCallCount).toBe(1);
    expect(strategy.shouldReuseCalls).toHaveLength(1);
    expect(strategy.createMetadataCalls).toHaveLength(1);
    expect(controlled.saveCalls).toHaveLength(1);
  });

  test("두 persistence snapshot provider를 연결하면 우선순위·fallback·부분 성공으로 중재되지 않고 core 생성 오류가 난다", () => {
    // given: 각각 record를 가진 두 persistence plugin — 잘못된 배선
    const firstStorage = makeControlledStorage({
      initialRecord: makeRecord(richSnapshot(), undefined),
    });
    const secondStorage = makeControlledStorage({
      initialRecord: makeRecord(richSnapshot(), undefined),
    });
    const firstOnLoadError = vi.fn(() => ({ policy: "recover" as const }));
    const secondOnLoadError = vi.fn(() => ({ policy: "recover" as const }));

    // when
    let caught: unknown;
    try {
      makeCoreStore({
        initialEvents: freshEvents(),
        plugins: [
          stackPersistencePlugin({
            storage: firstStorage.storage,
            onLoadError: firstOnLoadError,
          }),
          stackPersistencePlugin({
            storage: secondStorage.storage,
            onLoadError: secondOnLoadError,
          }),
        ],
      });
    } catch (error) {
      caught = error;
    }

    // then: 두 provider 모두 record를 공급한 뒤에야 — 즉 어느 한쪽을 조용히
    // 고르는 fallback 없이 — 생성이 거부됐다
    expect(firstStorage.loadCallCount).toBe(1);
    expect(secondStorage.loadCallCount).toBe(1);

    // then: snapshot 결함이 아니라 배선 오류로서의 생성 오류다
    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(SnapshotLoadError);

    // then: 어느 쪽 오류 정책도 중재에 동원되지 않았고 어떤 저장도 일어나지 않았다
    expect(firstOnLoadError).not.toHaveBeenCalled();
    expect(secondOnLoadError).not.toHaveBeenCalled();
    expect(firstStorage.saveCalls).toHaveLength(0);
    expect(secondStorage.saveCalls).toHaveLength(0);
  });
});

describe("write ordering, single-writer, cross-runtime 조정은 storage 계약이다", () => {
  test("겹치는 save와 중간 실패에서 plugin 측 계약은 호출 순서와 실패 후 후속 호출 지속까지다 — 실제 적용 순서·충돌 조정은 storage/소비자 책임이다", async () => {
    // given: 호출 순서와 완료 순서를 독립 제어하는 storage
    const controlled = makeControlledStorage();
    let saveErrorCount = 0;

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: controlled.storage,
          onSaveError() {
            saveErrorCount += 1;
          },
        }),
      ],
    });

    // when: 세 save가 겹치고(모두 pending) 하나가 실패한다
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "첫 번째 자동 저장 요청",
    );
    store.actions.push({
      activityId: "nav-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: {},
    });
    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 2,
      "두 번째 자동 저장 요청",
    );
    store.actions.stepPush({ stepId: "nav-step-2", stepParams: { page: "2" } });
    await advanceUntilIdle(store.actions.getStack);
    await waitForCondition(
      () => controlled.saveCalls.length >= 3,
      "세 번째 자동 저장 요청",
    );

    controlled.saveCalls[1].reject(new Error("save-failure-sentinel"));
    await waitForCondition(() => saveErrorCount >= 1, "중간 save 실패의 통지");
    controlled.saveCalls[0].resolve();
    controlled.saveCalls[2].resolve();

    // then (plugin 계약): 호출은 탐색 순서대로였고, 실패 뒤에도 후속 호출이 이어졌다
    expect(
      controlled.saveCalls.map((call) => call.record.snapshot.events.length),
    ).toEqual([1, 2, 3]);
    expect(controlled.saveCalls).toHaveLength(3);

    // then (storage fixture self-check): 적용 결과는 fixture의 완료 순서 정책이
    // 만든 것이다 — cross-tab 충돌 조정, merge, leader 선출을 plugin 결과로
    // 단언하지 않는다.
    expect(controlled.completedRecord).toBe(controlled.saveCalls[2].record);
  });
});

describe("History/URL 통합과 URL helper를 제공하지 않는다", () => {
  test("URL 비교는 명시 주입된 소비자 strategy 안에서만 일어나고, strategy를 생략하면 URL-like context가 달라도 재사용된다", () => {
    // given: URL-like context를 이해하는 소비자 strategy와 history-like observer
    type UrlMetadata = { url: string };
    const urlStrategy = {
      createMetadata: () => ({ url: "/articles/a-1" }),
      shouldReuse: ({
        record,
        initialContext,
      }: {
        record: Readonly<{ snapshot: StackSnapshot; metadata: UrlMetadata }>;
        initialContext: unknown;
      }) => (initialContext as { url: string }).url === record.metadata.url,
    };
    const record = makeRecord(richSnapshot(), { url: "/articles/a-1" });

    const startWithStrategy = (contextUrl: string) => {
      const controlled = makeControlledStorage<UrlMetadata>({
        initialRecord: record,
      });
      const observer = makeObserverPlugin("history-like-observer");
      const store = makeCoreStore({
        initialEvents: freshEvents(),
        initialContext: { url: contextUrl },
        plugins: [
          stackPersistencePlugin({
            storage: controlled.storage,
            strategy: urlStrategy,
          }),
          observer.plugin,
        ],
      });
      store.init();
      return { store, observer };
    };

    // when/then: 주입한 경우 — URL이 다르면 strategy의 판단으로 create
    const mismatch = startWithStrategy("/home");
    expect(mismatch.observer.initCalls[0].kind).toBe("create");
    expect(
      mismatch.store.actions.getStack().activities.map((a) => a.id),
    ).toEqual(["fresh-home-1"]);

    // when/then: 주입한 경우 — URL이 같으면 strategy의 판단으로 load
    const match = startWithStrategy("/articles/a-1");
    expect(match.observer.initCalls[0].kind).toBe("load");

    // when/then: 생략한 경우 — package 자신은 URL을 알지 못하므로
    // context가 달라도 구조 호환 snapshot은 재사용된다
    const plainStorage = makeControlledStorage({
      initialRecord: makeRecord(richSnapshot(), undefined),
    });
    const plainObserver = makeObserverPlugin("history-like-observer");
    const plainStore = makeCoreStore({
      initialEvents: freshEvents(),
      initialContext: { url: "/home" },
      plugins: [
        stackPersistencePlugin({ storage: plainStorage.storage }),
        plainObserver.plugin,
      ],
    });
    plainStore.init();
    expect(plainObserver.initCalls[0].kind).toBe("load");
    expect(navigationOrderIds(plainStore.actions.getStack())).toEqual([
      "rich-home-1",
      "rich-article-1",
    ]);
  });
});

describe("migration, version 정책, 삭제 lifecycle을 제공하지 않는다", () => {
  test("schema mismatch record는 오류 정책으로 끝나고, plugin은 변환·재저장 재시도나 삭제를 수행하지 않으며 다음 Idle의 fresh record가 정책 결과로 저장될 뿐이다", async () => {
    // given: 이전 schema record와 delete-like spy를 가진 storage
    const outdatedRecord = makeRecord(invalidSchemaSnapshot(), undefined);
    const controlled = makeControlledStorage({
      initialRecord: outdatedRecord,
    });
    const deleteSpy = vi.fn();
    const storageWithDelete = Object.assign(controlled.storage, {
      delete: deleteSpy,
    });
    const receivedErrors: unknown[] = [];

    // when: load하고 recover한 뒤 최초 Idle 저장까지 관찰한다
    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [
        stackPersistencePlugin({
          storage: storageWithDelete,
          onLoadError({ error }) {
            receivedErrors.push(error);
            return { policy: "recover" };
          },
        }),
      ],
    });
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "recover 후 fresh Idle의 자동 저장 요청",
    );

    // then: mismatch는 core 오류 정책으로 한 번 처리됐다
    expect(receivedErrors).toHaveLength(1);
    expect(receivedErrors[0]).toBeInstanceOf(SnapshotLoadError);
    expect(controlled.loadCallCount).toBe(1);

    // then: migration이 아니라 fresh 대체다 — 저장된 snapshot은 이전 record의
    // 변환본이 아니고, 삭제 lifecycle도 호출되지 않았다
    const savedIds = controlled.saveCalls[0].record.snapshot.events.map(
      (event) => event.id,
    );
    expect(savedIds).toContain("fresh-push-home");
    expect(savedIds).not.toContain("invalid-push-home");
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

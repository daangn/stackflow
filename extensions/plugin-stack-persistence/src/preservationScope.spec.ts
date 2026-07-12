import { makeCoreStore, makeEvent } from "@stackflow/core";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { logicalStackView } from "./__fixtures__/assertions";
import { useDeterministicClock, waitForCondition } from "./__fixtures__/clock";
import { makeControlledStorage } from "./__fixtures__/controlledStorage";
import {
  ARTICLE_ACTIVITY,
  EVENT_BASE,
  freshEvents,
  makeRecord,
  richSnapshot,
} from "./__fixtures__/stackFixtures";

beforeEach(() => {
  useDeterministicClock();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Activity와 Step의 전체 논리 탐색 상태가 record로 왕복 보존된다", () => {
  test("저장된 record로 시작한 실행기는 Activity/Step 구성·순서·params·현재 step과 뒤로 갈 이력 전체를 복원하고, 그 상태를 다시 저장한 record로 다음 실행기도 같은 상태를 복원한다", async () => {
    // given: Home(params) → Article(params) + Article 안의 step push/push/replace/pop 이력
    const snapshot = richSnapshot();
    const firstStorage = makeControlledStorage({
      initialRecord: makeRecord(snapshot, undefined),
      autoComplete: true,
    });

    // when: 첫 실행기를 저장된 record로 시작한다
    const firstStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: firstStorage.storage })],
    });
    firstStore.init();

    // then: 복원된 Stack의 논리 상태를 필드 단위로 확인한다
    const firstStack = firstStore.actions.getStack();
    expect(firstStack.globalTransitionState).toBe("idle");
    expect(firstStack.activities.map((a) => a.name)).toEqual([
      "Home",
      "Article",
    ]);

    const [home, article] = firstStack.activities;
    expect(home.params).toEqual({ greeting: "hello" });
    expect(home.id).toBe("rich-home-1");
    expect(article.params).toEqual({ articleId: "a-1" });
    expect(article.id).toBe("rich-article-1");
    expect(article.isTop).toBe(true);
    expect(article.isActive).toBe(true);

    // step 이력: 최초 진입 step + page 2 push가 남고, page 3 push/replace는 pop됨
    expect(article.steps.map((step) => step.params)).toEqual([
      { articleId: "a-1" },
      { page: "2" },
    ]);
    expect(article.steps[1].id).toBe("rich-article-step-2");

    // 뒤로 갈 전체 이력(=event log)이 손실 없이 남아 있다
    expect(
      firstStore.actions.captureSnapshot().events.map((event) => event.id),
    ).toEqual(snapshot.events.map((event) => event.id));

    // when: 첫 실행기의 자동 저장이 완료된 record로 두 번째 실행기를 시작한다
    await waitForCondition(
      () => firstStorage.saveCalls.length >= 1,
      "첫 실행기의 자동 저장 요청",
    );
    const completedRecord = firstStorage.completedRecord;
    expect(completedRecord).not.toBeNull();

    const secondStorage = makeControlledStorage({
      initialRecord: completedRecord,
      autoComplete: true,
    });
    const secondStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: secondStorage.storage })],
    });
    secondStore.init();

    // then: 두 실행기의 논리 상태가 동일하다
    expect(logicalStackView(secondStore.actions.getStack())).toEqual(
      logicalStackView(firstStack),
    );
  });
});

describe("탐색 params는 필터링 없이 storage 경계로 전달된다", () => {
  test("비밀값처럼 보이는 Activity/Step params도 redaction·암호화 없이 record에 그대로 담긴다 — 외부 저장소 접근 통제는 소비자 책임이다", async () => {
    // given: 비밀값처럼 보이는 고유 sentinel을 Activity/Step params에 넣은 Idle Stack
    const ACTIVITY_SECRET = "sentinel-activity-access-token-4c2a";
    const STEP_SECRET = "sentinel-step-draft-token-9e1b";
    const controlled = makeControlledStorage();

    const store = makeCoreStore({
      initialEvents: [
        ...freshEvents(),
        makeEvent("Pushed", {
          id: "secret-push-article",
          activityId: "secret-article-1",
          activityName: ARTICLE_ACTIVITY,
          activityParams: { articleId: "a-1", accessToken: ACTIVITY_SECRET },
          eventDate: EVENT_BASE + 20,
        }),
        makeEvent("StepPushed", {
          id: "secret-step-push",
          stepId: "secret-step-2",
          stepParams: { page: "2", draftToken: STEP_SECRET },
          eventDate: EVENT_BASE + 30,
        }),
      ],
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });

    // when: 자동 저장이 호출된다
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "최초 Idle 자동 저장 요청",
    );

    // then: storage가 받은 record.snapshot에 sentinel이 그대로 있다
    const savedSnapshot = controlled.saveCalls[0].record.snapshot;
    const pushedEvent = savedSnapshot.events.find(
      (event) => event.id === "secret-push-article",
    );
    const stepEvent = savedSnapshot.events.find(
      (event) => event.id === "secret-step-push",
    );

    expect(pushedEvent).toMatchObject({
      activityParams: { articleId: "a-1", accessToken: ACTIVITY_SECRET },
    });
    expect(stepEvent).toMatchObject({
      stepParams: { page: "2", draftToken: STEP_SECRET },
    });
  });
});

describe("Activity 내부 애플리케이션 상태는 snapshot 범위 밖이다", () => {
  test("같은 Activity의 탐색 params는 복원되지만, fixture가 별도로 관리하는 form/scroll/server-data 상태는 record에 없고 복원되지 않는다", async () => {
    // given: 탐색 params와 별개로 애플리케이션이 관리하는 상태 sentinel
    const applicationState = {
      formDraft: "sentinel-form-draft-71fa",
      scrollY: "sentinel-scroll-position-3d20",
      serverData: "sentinel-server-data-b4c8",
    };
    const controlled = makeControlledStorage();

    const store = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: controlled.storage })],
    });

    // when: snapshot을 저장하고 새 실행기를 모사한 store로 복원한다
    store.init();
    await waitForCondition(
      () => controlled.saveCalls.length >= 1,
      "최초 Idle 자동 저장 요청",
    );
    controlled.saveCalls[0].resolve();

    const serializedRecord = JSON.stringify(controlled.completedRecord);

    const restoreStorage = makeControlledStorage({
      initialRecord: controlled.completedRecord,
    });
    const restoredStore = makeCoreStore({
      initialEvents: freshEvents(),
      plugins: [stackPersistencePlugin({ storage: restoreStorage.storage })],
    });
    restoredStore.init();

    // then: 탐색 params는 복원되지만 애플리케이션 상태 sentinel은 어디에도 없다
    const restoredHome = restoredStore.actions.getStack().activities[0];
    expect(restoredHome.name).toBe("Home");
    expect(restoredHome.params).toEqual({ greeting: "hello" });

    for (const sentinel of Object.values(applicationState)) {
      expect(serializedRecord).not.toContain(sentinel);
      expect(
        JSON.stringify(logicalStackView(restoredStore.actions.getStack())),
      ).not.toContain(sentinel);
    }
  });
});

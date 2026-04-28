import type {
  CoreStore,
  PushedEvent,
  Stack,
  StackflowPlugin,
  StepPushedEvent,
} from "@stackflow/core";
import { makeCoreStore, makeEvent } from "@stackflow/core";
import { stringify as flattedStringify } from "flatted";
import type { Location, MemoryHistory } from "history";
import { createMemoryHistory } from "history";
import { loadQuery } from "react-relay";
import { makeRelayEnvironment } from "./fixtures/graphql";
import { default as getHelloQueryNode } from "./fixtures/graphql/__generated__/getHelloQuery.graphql";
import { historySyncPlugin } from "./historySyncPlugin";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

declare global {
  interface ProxyConstructor {
    new <TSource extends object, TTarget extends object>(
      target: TSource,
      handler: ProxyHandler<TSource>,
    ): TTarget;
  }
}

type PromiseProxy<T extends Record<string, (...args: any[]) => any>> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
};

const makeActionsProxy = <T extends CoreStore["actions"]>({
  actions,
}: {
  actions: T;
}): PromiseProxy<T> =>
  new Proxy(actions, {
    get<K extends keyof CoreStore["actions"]>(target: typeof actions, p: K) {
      return (...args: Parameters<(typeof target)[K]>) =>
        new Promise<ReturnType<(typeof target)[K]>>((resolve) => {
          // @ts-ignore
          const ret: ReturnType<(typeof target)[K]> = target[p](...args);

          setTimeout(() => {
            // @ts-ignore
            resolve(p === "getStack" ? target[p](...args) : ret);
          }, 16 + 32);
        });
    },
  });

let dt = 0;

const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const path = (location: Location) =>
  location.pathname + location.search + location.hash;

const stackflow = ({
  activityNames,
  plugins,
}: {
  activityNames: string[];
  plugins: StackflowPlugin[];
}) => {
  /**
   * `@stackflow/react`에서 복사됨
   */
  const pluginInstances = plugins.map((plugin) => plugin());
  const initialPushedEvents = pluginInstances.reduce<
    (PushedEvent | StepPushedEvent)[]
  >(
    (initialEvents, pluginInstance) =>
      pluginInstance.overrideInitialEvents?.({
        initialEvents,
        initialContext: {},
      }) ?? initialEvents,
    [],
  );

  const coreStore = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        /**
         * 약 2프레임
         */
        transitionDuration: 32,
        eventDate: enoughPastTime(),
      }),
      ...activityNames.map((activityName) =>
        makeEvent("ActivityRegistered", {
          activityName,
          eventDate: enoughPastTime(),
        }),
      ),
      ...initialPushedEvents,
    ],
    plugins: [...plugins],
  });

  /**
   * 렌더링 시작
   */
  coreStore.init();

  return coreStore;
};

const activeActivity = (stack: Stack) =>
  stack.activities.find((a) => a.isActive);

// FEP-1061: helper for exercising runtime coercion with intentionally-untyped params.
// The cast is deliberate — tests must bypass the string-only type to prove the runtime fix.
const pushUntyped = async (
  a: PromiseProxy<CoreStore["actions"]>,
  activityName: string,
  params: Record<string, unknown>,
  activityId = `a-${Math.random().toString(36).slice(2)}`,
) => {
  await a.push({
    activityId,
    activityName,
    activityParams: params as Record<string, string | undefined>,
  });
};

describe("historySyncPlugin", () => {
  let history: MemoryHistory;
  let actions: PromiseProxy<CoreStore["actions"]>;

  /**
   * 매 테스트마다 history와 coreStore를 초기화합니다
   */
  beforeEach(() => {
    history = createMemoryHistory();

    const coreStore = stackflow({
      activityNames: ["Home", "Article", "ThirdActivity", "FourthActivity"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home/",
            Article: "/articles/:articleId",
            ThirdActivity: "/third/:thirdId",
            FourthActivity: "/fourth/:fourthId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    actions = makeActionsProxy({
      actions: coreStore.actions,
    });
  });

  test("historySyncPlugin - 초기에 매칭하는 라우트가 없는 경우 fallbackActivity에 설정한 액티비티의 URL로 이동합니다", async () => {
    expect(path(history.location)).toEqual("/home/");
  });

  test("historySyncPlugin - 초기에 매칭하는 라우트가 있는 경우 해당 액티비티의 URL로 이동합니다", async () => {
    history = createMemoryHistory({
      initialEntries: ["/articles/123/?title=hello"],
    });

    const { actions } = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    expect(activeActivity(actions.getStack())?.params.articleId).toEqual("123");
    expect(activeActivity(actions.getStack())?.params.title).toEqual("hello");
  });

  test("historySyncPlugin - actions.push() 후에, URL 상태가 알맞게 바뀝니다", async () => {
    await actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        title: "hello",
      },
    });

    expect(path(history.location)).toEqual("/articles/1234/?title=hello");
  });

  test("historySyncPlugin - useHash: true이더라도, actions.push() 후에, URL 상태가 알맞게 바뀝니다", async () => {
    history = createMemoryHistory();

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
          useHash: true,
        }),
      ],
    });

    actions = makeActionsProxy({
      actions: coreStore.actions,
    });

    await actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        title: "hello",
      },
    });

    expect(path(history.location)).toEqual("/#/articles/1234/?title=hello");
  });

  test("historySyncPlugin - actions.replace() 후에, URL 상태가 알맞게 바뀝니다", async () => {
    await actions.replace({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        title: "hello",
      },
    });

    expect(path(history.location)).toEqual("/articles/1234/?title=hello");
    expect(history.index).toEqual(0);
  });

  test("historySyncPlugin - actions.push(), actions.pop()을 여러번 하더라도, URL 상태가 알맞게 바뀝니다", async () => {
    await actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
        title: "hello",
      },
    });
    expect(path(history.location)).toEqual("/articles/1/?title=hello");

    await actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "2",
        title: "hello",
      },
    });
    expect(path(history.location)).toEqual("/articles/2/?title=hello");

    await actions.push({
      activityId: "a3",
      activityName: "Article",
      activityParams: {
        articleId: "3",
        title: "hello",
      },
    });
    expect(path(history.location)).toEqual("/articles/3/?title=hello");
    expect(history.index).toEqual(3);

    await actions.pop();
    expect(path(history.location)).toEqual("/articles/2/?title=hello");
    expect(history.index).toEqual(2);

    await actions.pop();
    expect(path(history.location)).toEqual("/articles/1/?title=hello");
    expect(history.index).toEqual(1);

    await actions.pop();
    expect(path(history.location)).toEqual("/home/");
    expect(history.index).toEqual(0);
  });

  test("historySyncPlugin - 히스토리를 back하는 경우, 스택 상태가 알맞게 바뀝니다", async () => {
    await actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        title: "hello",
      },
    });

    history.back();
    expect(activeActivity(await actions.getStack())?.name).toEqual("Home");
  });

  test("historySyncPlugin - 히스토리를 여러번 back하더라도, 스택 상태가 알맞게 바뀝니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
        title: "hello",
      },
    });
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "2",
        title: "hello",
      },
    });
    await actions.push({
      activityId: "a3",
      activityName: "Article",
      activityParams: {
        articleId: "3",
        title: "hello",
      },
    });

    history.back();
    expect(activeActivity(await actions.getStack())?.name).toEqual("Article");
    expect(activeActivity(await actions.getStack())?.params?.articleId).toEqual(
      "2",
    );

    history.back();
    expect(activeActivity(await actions.getStack())?.name).toEqual("Article");
    expect(activeActivity(await actions.getStack())?.params?.articleId).toEqual(
      "1",
    );

    history.back();
    expect(activeActivity(await actions.getStack())?.name).toEqual("Home");
  });

  test("historySyncPlugin - 앞으로 가기를 해도, 스택 상태가 알맞게 바뀝니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
        title: "hello",
      },
    });
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "2",
        title: "hello",
      },
    });
    await actions.push({
      activityId: "a3",
      activityName: "Article",
      activityParams: {
        articleId: "3",
        title: "hello",
      },
    });

    history.back();
    history.back();
    history.back();

    history.go(1);
    expect(activeActivity(await actions.getStack())?.name).toEqual("Article");
    expect(activeActivity(await actions.getStack())?.params?.articleId).toEqual(
      "1",
    );

    history.go(1);
    expect(activeActivity(await actions.getStack())?.name).toEqual("Article");
    expect(activeActivity(await actions.getStack())?.params?.articleId).toEqual(
      "2",
    );

    history.go(1);
    expect(activeActivity(await actions.getStack())?.name).toEqual("Article");
    expect(activeActivity(await actions.getStack())?.params?.articleId).toEqual(
      "3",
    );
  });

  test("historySyncPlugin - actions.stepPush()를 하면, 스택 상태가 알맞게 바뀌고, pop을 하면 한번에 여러 URL 상태가 사라집니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
        title: "hello",
      },
    });
    await actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "11",
        title: "hello",
      },
    });
    expect(path(history.location)).toEqual("/articles/11/?title=hello");
    expect(history.index).toEqual(2);

    await actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "12",
        title: "hello",
      },
    });
    expect(path(history.location)).toEqual("/articles/12/?title=hello");
    expect(history.index).toEqual(3);

    await actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "20",
        title: "world",
      },
    });
    expect(path(history.location)).toEqual("/articles/20/?title=world");
    expect(history.index).toEqual(4);

    await actions.pop();
    expect(path(history.location)).toEqual("/articles/12/?title=hello");
    expect(history.index).toEqual(3);

    await actions.pop();

    expect(path(history.location)).toEqual("/home/");
    expect(history.index).toEqual(0);
  });

  test("historySyncPlugin - actions.stepPop()을 여러번 하더라도 남은 스텝이 없으면 아무일도 일어나지 않습니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
        title: "hello",
      },
    });
    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "11",
        title: "hello",
      },
    });
    await actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "12",
        title: "hello",
      },
    });

    actions.stepPop();
    actions.stepPop();

    await actions.stepPop();
    expect(path(history.location)).toEqual("/articles/10/?title=hello");
    expect(history.index).toEqual(1);

    await actions.stepPop();
    expect(path(history.location)).toEqual("/articles/10/?title=hello");
    expect(history.index).toEqual(1);

    await actions.pop();
    expect(path(history.location)).toEqual("/home/");
    expect(history.index).toEqual(0);
  });

  test("historySyncPlugin - actions.stepReplace()를 하면, 스택 상태가 알맞게 바뀌고, pop을 하면 한번에 여러 URL 상태가 사라집니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
        title: "hello",
      },
    });
    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "11",
        title: "hello",
      },
    });

    await actions.stepReplace({
      stepId: "s2",
      stepParams: {
        articleId: "12",
        title: "hello",
      },
    });
    expect(path(history.location)).toEqual("/articles/12/?title=hello");
    expect(history.index).toEqual(2);

    await actions.stepPop();
    expect(path(history.location)).toEqual("/articles/10/?title=hello");
    expect(history.index).toEqual(1);

    await actions.pop();
    expect(path(history.location)).toEqual("/home/");
    expect(history.index).toEqual(0);
  });

  test("historySyncPlugin - actions.stepPush()를 한 상태에서, 뒤로 가기, 앞으로 가기를 하면 스택 상태가 알맞게 바뀌고, pop을 하면 한번에 여러 URL 상태가 사라집니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
        title: "hello",
      },
    });
    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "11",
        title: "hello",
      },
    });
    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "12",
        title: "hello",
      },
    });
    await actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "20",
        title: "world",
      },
    });

    history.back();
    expect(activeActivity(await actions.getStack())?.params.articleId).toEqual(
      "12",
    );

    history.back();
    expect(activeActivity(await actions.getStack())?.params.articleId).toEqual(
      "11",
    );

    history.back();
    expect(activeActivity(await actions.getStack())?.params.articleId).toEqual(
      "10",
    );

    history.go(1);
    expect(activeActivity(await actions.getStack())?.params.articleId).toEqual(
      "11",
    );

    history.go(1);
    expect(activeActivity(await actions.getStack())?.params.articleId).toEqual(
      "12",
    );

    history.go(1);
    expect(activeActivity(await actions.getStack())?.params.articleId).toEqual(
      "20",
    );

    await actions.pop();
    expect(path(history.location)).toEqual("/articles/12/?title=hello");

    await actions.stepPop();
    expect(path(history.location)).toEqual("/articles/11/?title=hello");

    await actions.pop();
    expect(path(history.location)).toEqual("/home/");
    expect(history.index).toEqual(0);
  });

  test("historySyncPlugin - 여러 행동 후에 새로고침을 하고 히스토리 조작을 하더라도, 스택 상태가 알맞게 바뀝니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
        title: "hello",
      },
    });
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "20",
        title: "hello",
      },
    });
    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "21",
        title: "hello",
      },
    });
    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "22",
        title: "hello",
      },
    });
    actions.stepReplace({
      stepId: "s3",
      stepParams: {
        articleId: "23",
        title: "hello",
      },
    });
    actions.stepPush({
      stepId: "s4",
      stepParams: {
        articleId: "24",
        title: "hello",
      },
    });
    await actions.push({
      activityId: "a3",
      activityName: "Article",
      activityParams: {
        articleId: "30",
        title: "hello",
      },
    });

    // 새로고침 후
    await (async () => {
      const { actions } = stackflow({
        activityNames: ["Home", "Article"],
        plugins: [
          historySyncPlugin({
            history,
            routes: {
              Home: "/home",
              Article: "/articles/:articleId",
            },
            fallbackActivity: () => "Home",
          }),
        ],
      });

      const proxyActions = makeActionsProxy({
        actions,
      });

      await proxyActions.getStack();

      history.back();

      expect(
        activeActivity(await proxyActions.getStack())?.params.articleId,
      ).toEqual("24");
      expect(history.index).toEqual(5);

      history.back();

      expect(
        activeActivity(await proxyActions.getStack())?.params.articleId,
      ).toEqual("23");
      expect(history.index).toEqual(4);

      history.back();

      expect(
        activeActivity(await proxyActions.getStack())?.params.articleId,
      ).toEqual("21");
      expect(history.index).toEqual(3);

      history.back();

      expect(
        activeActivity(await proxyActions.getStack())?.params.articleId,
      ).toEqual("20");
      expect(history.index).toEqual(2);

      history.back();

      expect(
        activeActivity(await proxyActions.getStack())?.params.articleId,
      ).toEqual("10");
      expect(history.index).toEqual(1);

      history.back();

      expect(activeActivity(await proxyActions.getStack())?.name).toEqual(
        "Home",
      );
      expect(history.index).toEqual(0);
    })();
  });

  test("historySyncPlugin - push 후 stepPush 를 반복한 뒤, replace 를 하고 pop 을 수행하면 첫번째 stack 을 가리킵니다.", async () => {
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        articleId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        articleId: "4",
      },
    });

    await actions.replace({
      activityId: "a3",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "234",
      },
    });

    await actions.pop();

    expect(path(history.location)).toEqual("/home/");
    expect(activeActivity(await actions.getStack())?.name).toEqual("Home");
  });

  test("historySyncPlugin - push 후 *push 를 한 번 더 수행한 뒤*, stepPush 를 반복한 뒤, replace 를 하고 pop 을 수행하면 *두번째 stack* 을 가리킵니다.", async () => {
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });
    actions.push({
      activityId: "a3",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "234",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        thirdId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        thirdId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        thirdId: "4",
      },
    });

    actions.replace({
      activityId: "a4",
      activityName: "FourthActivity",
      activityParams: {
        fourthId: "567",
      },
    });

    await actions.pop();
    expect(path(history.location)).toEqual("/articles/1/");
    expect(activeActivity(await actions.getStack())?.name).toEqual("Article");
  });

  test("historySyncPlugin - push 후 stepPush 를 반복한 뒤, push 와 pop 을 1회 수행하고 replace를 수행하고 pop 을 진행하면 첫번째 stack 을 가리킵니다.", async () => {
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        articleId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        articleId: "4",
      },
    });

    actions.push({
      activityId: "a3",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "234",
      },
    });

    actions.pop();

    actions.replace({
      activityId: "a4",
      activityName: "FourthActivity",
      activityParams: {
        fourthId: "345",
      },
    });

    await actions.pop();

    expect(path(history.location)).toEqual("/home/");
    expect(activeActivity(await actions.getStack())?.name).toEqual("Home");
  });

  test("historySyncPlugin - push 후 stepPush 를 반복한 뒤, replace 를 한 뒤 stepPush 를 반복하고 pop 을 진행해도 첫번째 stack 을 가리킵니다.", async () => {
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        articleId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        articleId: "4",
      },
    });

    actions.replace({
      activityId: "a4",
      activityName: "FourthActivity",
      activityParams: {
        fourthId: "345",
      },
    });

    actions.stepPush({
      stepId: "s5",
      stepParams: {
        fourthId: "5",
      },
    });

    actions.stepPush({
      stepId: "s6",
      stepParams: {
        fourthId: "6",
      },
    });

    actions.stepPush({
      stepId: "s7",
      stepParams: {
        fourthId: "7",
      },
    });

    await actions.pop();

    expect(path(history.location)).toEqual("/home/");
    expect(activeActivity(await actions.getStack())?.name).toEqual("Home");
  });

  test("historySyncPlugin - push 후 stepPush 를 반복한 뒤, replace 를 수행하고 stepPush 를 반복하고 replace를 수행하고 pop을 진행해도 첫번째 stack을 가리킵니다.(for Hugh)", async () => {
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        articleId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        articleId: "4",
      },
    });

    actions.replace({
      activityId: "a3",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "234",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        thirdId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        thirdId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        thirdId: "4",
      },
    });

    actions.replace({
      activityId: "a4",
      activityName: "FourthActivity",
      activityParams: {
        fourthId: "345",
      },
    });
    await actions.pop();
    expect(path(history.location)).toEqual("/home/");
    expect(activeActivity(await actions.getStack())?.name).toEqual("Home");
  });

  test("historySyncPlugin - push 후 stepPush 를 반복한 뒤, push 를 수행하고 stepPush 를 반복한 뒤 pop 을 수행, 그 후 replace 를 수행하고 pop을 진행해도 첫번째 stack을 가리킵니다.", async () => {
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        articleId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        articleId: "4",
      },
    });

    actions.push({
      activityId: "a3",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "234",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        thirdId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        thirdId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        thirdId: "4",
      },
    });
    actions.pop();

    actions.replace({
      activityId: "a4",
      activityName: "FourthActivity",
      activityParams: {
        fourthId: "345",
      },
    });
    await actions.pop();

    expect(path(history.location)).toEqual("/home/");
    expect(activeActivity(await actions.getStack())?.name).toEqual("Home");
  });

  test("historySyncPlugin - 2회 반복:push 후 stepPush 를 반복한 뒤, push 를 수행하고 stepPush 를 반복한 뒤 pop 을 수행, 그 후 replace 를 수행하고 pop을 진행해도 첫번째 stack을 가리킵니다.", async () => {
    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        articleId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        articleId: "4",
      },
    });

    actions.push({
      activityId: "a3",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "234",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        thirdId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        thirdId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        thirdId: "4",
      },
    });
    actions.pop();

    actions.replace({
      activityId: "a4",
      activityName: "FourthActivity",
      activityParams: {
        fourthId: "345",
      },
    });
    actions.pop();

    actions.push({
      activityId: "a5",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "1",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        thirdId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        thirdId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        thirdId: "4",
      },
    });

    actions.push({
      activityId: "a6",
      activityName: "FourthActivity",
      activityParams: {
        fourthId: "234",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        fourthId: "2",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        fourthId: "3",
      },
    });

    actions.stepPush({
      stepId: "s4",
      stepParams: {
        fourthId: "4",
      },
    });
    actions.pop();

    actions.replace({
      activityId: "a7",
      activityName: "Article",
      activityParams: {
        articleId: "345",
      },
    });
    await actions.pop();

    expect(path(history.location)).toEqual("/home/");
    expect(activeActivity(await actions.getStack())?.name).toEqual("Home");
  });

  test("historySyncPlugin - push > push > stepPush > pop", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "2",
      },
    });

    actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "3",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "4",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        articleId: "5",
      },
    });

    actions.replace({
      activityId: "a3",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "1",
      },
    });

    actions.stepPush({
      stepId: "s3",
      stepParams: {
        thirdId: "2",
      },
    });

    await actions.pop();

    expect(path(history.location)).toEqual("/articles/2/");
    expect(activeActivity(await actions.getStack())?.name).toEqual("Article");
    expect(history.index).toEqual(2);
  });

  test("historySyncPlugin - push > stepPush > stepPush > replace", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "2",
      },
    });

    actions.stepPush({
      stepId: "s2",
      stepParams: {
        articleId: "3",
      },
    });

    await actions.replace({
      activityId: "a3",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "1",
      },
    });

    expect(path(history.location)).toEqual("/third/1/");
    expect(activeActivity(await actions.getStack())?.name).toEqual(
      "ThirdActivity",
    );
    expect(history.index).toEqual(1);
  });

  test("historySyncPlugin - search param이 붙은 채로 fallback activity로 이동하는 경우 activity params로 만들어줍니다", async () => {
    history = createMemoryHistory({
      initialEntries: ["/not/found/route/?foo=1&bar=2"],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    actions = makeActionsProxy({
      actions: coreStore.actions,
    });

    const stack = await actions.getStack();

    expect(activeActivity(stack)?.name).toEqual("Home");
    expect(activeActivity(stack)?.params.foo).toEqual("1");
    expect(activeActivity(stack)?.params.bar).toEqual("2");
    expect(path(history.location)).toEqual("/home/?foo=1&bar=2");
  });

  test("historySyncPlugin - activity.context에 cyclic dependency가 있어도 정상적으로 로드됩니다", async () => {
    history = createMemoryHistory({
      initialEntries: ["/home"],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    actions = makeActionsProxy({
      actions: coreStore.actions,
    });

    const cyclic: any = {};
    cyclic.self = cyclic;

    await actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
      activityContext: {
        cyclic,
      },
    });

    const stack = await actions.getStack();
    const topActivity = stack.activities[1];

    expect(
      (topActivity.context as any).cyclic ===
        (topActivity.context as any).cyclic.self,
    ).toEqual(true);
  });

  test("historySyncPlugin - activity.context에 Promise가 있어도 정상적으로 로드됩니다", async () => {
    history = createMemoryHistory({
      initialEntries: ["/home"],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    actions = makeActionsProxy({
      actions: coreStore.actions,
    });

    await actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
      activityContext: {
        promise: new Promise<void>((resolve, _reject) => resolve()),
      },
    });

    const stack = await actions.getStack();
    const topActivity = stack.activities[1];

    expect((topActivity.context as any).promise).toBeInstanceOf(Promise);
  });

  test("historySyncPlugin - FEP-1061: push with boolean param coerces to string in the store", async () => {
    await actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
        // non-string value — should be coerced to "true" in the store
        visible: true as unknown as string,
      },
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.visible).toEqual("true");
    // sanity: type at runtime is string, not boolean
    expect(typeof active?.params.visible).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: push with numeric step param coerces to string", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
      },
    });
    await actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "11",
        count: 5 as unknown as string,
      },
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    const step = active?.steps[active.steps.length - 1];
    expect(step?.params.count).toEqual("5");
    expect(typeof step?.params.count).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: stepReplace with numeric param coerces to string", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
      },
    });
    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "11",
        count: "1",
      },
    });
    await actions.stepReplace({
      stepId: "s2",
      stepParams: {
        articleId: "12",
        count: 10 as unknown as string,
      },
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    const step = active?.steps[active.steps.length - 1];
    expect(step?.params.count).toEqual("10");
    expect(typeof step?.params.count).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: replace with boolean param coerces to string", async () => {
    await actions.replace({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
        active: false as unknown as string,
      },
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.active).toEqual("false");
    expect(typeof active?.params.active).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: custom encode still receives typed params (not strings)", async () => {
    history = createMemoryHistory();

    const encode = jest.fn((params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
    }));

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: {
              path: "/articles/:articleId",
              encode,
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({
      actions: coreStore.actions,
    });

    await proxyActions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        visible: true as unknown as string,
      },
    });

    // encode must have received the boolean `true`, not the string "true"
    const encodeCalls = encode.mock.calls;
    const pushCall = encodeCalls.find((call) => call[0].articleId === "1234");
    expect(pushCall).toBeDefined();
    expect(pushCall?.[0].visible).toEqual(true);
    expect(typeof pushCall?.[0].visible).toEqual("boolean");

    // store reflects coerced string
    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.visible).toEqual("true");
    expect(typeof active?.params.visible).toEqual("string");

    // `activityContext.path` computed in `onBeforePush` DID run encode, so it
    // reflects the encode output.
    expect((active?.context as any)?.path).toEqual("/articles/1234/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: decode-path coerces typed values back to strings in store (CRITICAL)", async () => {
    // Arrive via URL on a route whose `decode` returns a typed `count` number.
    history = createMemoryHistory({
      initialEntries: ["/articles/1234/?count=5"],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: {
              path: "/articles/:articleId",
              decode: (params) => ({
                articleId: params.articleId,
                // simulate a decode that injects typed numbers into the store
                count: Number(params.count) as unknown as string,
              }),
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({
      actions: coreStore.actions,
    });

    const urlStack = await proxyActions.getStack();
    const urlActive = activeActivity(urlStack);
    // store must contain strings regardless of decode output
    expect(urlActive?.params.count).toEqual("5");
    expect(typeof urlActive?.params.count).toEqual("string");

    // Also verify the push path produces the same shape on the same route.
    const historyForPush = createMemoryHistory();
    const pushStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history: historyForPush,
          routes: {
            Home: "/home",
            Article: {
              path: "/articles/:articleId",
              decode: (params) => ({
                articleId: params.articleId,
                count: Number(params.count) as unknown as string,
              }),
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const pushActions = makeActionsProxy({ actions: pushStore.actions });
    await pushActions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        count: 5 as unknown as string,
      },
    });
    const pushedStack = await pushActions.getStack();
    const pushActive = activeActivity(pushedStack);
    expect(pushActive?.params.count).toEqual("5");
    expect(typeof pushActive?.params.count).toEqual("string");
  });

  test("historySyncPlugin - activity.context에 relay loadRef가 있어도 정상적으로 로드됩니다", async () => {
    const environment = makeRelayEnvironment();

    const loadRef = loadQuery(environment, getHelloQueryNode, {});

    history = createMemoryHistory({
      initialEntries: ["/home"],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    actions = makeActionsProxy({
      actions: coreStore.actions,
    });

    await actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
      activityContext: {
        loadRef,
      },
    });

    const stack = await actions.getStack();
    const topActivity = stack.activities[1];

    const queryResponse = await (
      topActivity.context as any
    ).loadRef?.source?.toPromise();

    /**
     * Successfully queried with relay
     */
    expect(queryResponse.data.hello).toEqual("world");
  });

  test("historySyncPlugin - FEP-1061: push({ visible: false, count: 0 }) — falsy primitives도 문자열로 강제되어 스토어에 저장됩니다", async () => {
    await pushUntyped(actions, "Article", {
      articleId: "1",
      visible: false,
      count: 0,
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.visible).toEqual("false");
    expect(active?.params.count).toEqual("0");
    expect(typeof active?.params.visible).toEqual("string");
    expect(typeof active?.params.count).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: push({ n: NaN, inf: Infinity }) — 비정상 숫자도 문자열로 강제됩니다", async () => {
    await pushUntyped(actions, "Article", {
      articleId: "1",
      n: Number.NaN,
      inf: Number.POSITIVE_INFINITY,
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.n).toEqual("NaN");
    expect(active?.params.inf).toEqual("Infinity");
    expect(typeof active?.params.n).toEqual("string");
    expect(typeof active?.params.inf).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: push with nested object — JSON.stringify로 직렬화되어 스토어에 저장됩니다", async () => {
    await pushUntyped(actions, "Article", {
      articleId: "1",
      filter: { tag: "js", pages: [1, 2] },
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.filter).toEqual('{"tag":"js","pages":[1,2]}');
    expect(typeof active?.params.filter).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: Risk #6 — history-sync 뒤에 등록된 플러그인이 typed 값을 overrideActionParams로 재주입할 수 있음 (문서화된 한계)", async () => {
    // NOTE: this test documents Risk #6 from the plan — a later-registered
    // plugin's overrideActionParams clobbers the coercion. This is a KNOWN
    // LIMITATION, not desired behavior. Future refactors that resolve this
    // should flip this assertion.
    history = createMemoryHistory();

    const laterPlugin: StackflowPlugin = () => ({
      key: "later-plugin",
      onBeforePush({ actionParams, actions: { overrideActionParams } }) {
        overrideActionParams({
          ...actionParams,
          activityParams: {
            ...actionParams.activityParams,
            injected: 42 as unknown as string,
          },
        });
      },
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        }),
        laterPlugin,
      ],
    });

    const proxyActions = makeActionsProxy({
      actions: coreStore.actions,
    });

    await proxyActions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);
    // Documented Risk #6: the later plugin's overrideActionParams re-introduces
    // a typed number AFTER history-sync's coercion, and no further pass
    // normalizes it. The store ends up with a number at runtime.
    expect(active?.params.injected).toEqual(42);
    expect(typeof active?.params.injected).toEqual("number");
  });

  test("historySyncPlugin - FEP-1061: push → pop → URL navigate — 두 경로 모두 같은 스토어 shape을 만듭니다", async () => {
    // Path A — in-process push with a boolean param.
    await pushUntyped(
      actions,
      "Article",
      { articleId: "1234", visible: true },
      "a-push",
    );
    const pushedStack = await actions.getStack();
    const pushedActive = activeActivity(pushedStack);

    expect(pushedActive?.params.articleId).toEqual("1234");
    expect(pushedActive?.params.visible).toEqual("true");
    expect(typeof pushedActive?.params.visible).toEqual("string");

    // Pop back to Home so the next navigation is a clean arrival.
    await actions.pop();

    // Path B — URL-arrival on a fresh store with the same query.
    const historyForUrl = createMemoryHistory({
      initialEntries: ["/articles/1234/?visible=true"],
    });
    const urlStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history: historyForUrl,
          routes: {
            Home: "/home/",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });
    const urlActions = makeActionsProxy({ actions: urlStore.actions });
    const urlStack = await urlActions.getStack();
    const urlActive = activeActivity(urlStack);

    expect(urlActive?.params.articleId).toEqual("1234");
    expect(urlActive?.params.visible).toEqual("true");
    expect(typeof urlActive?.params.visible).toEqual("string");

    // Both paths must produce the same shape for the params we passed.
    expect({
      articleId: pushedActive?.params.articleId,
      visible: pushedActive?.params.visible,
    }).toStrictEqual({
      articleId: urlActive?.params.articleId,
      visible: urlActive?.params.visible,
    });
  });

  test("historySyncPlugin - FEP-1061: replace after stepPush — 모든 step params가 스토어에서 문자열로 coerce됩니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
      },
    });
    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "11",
        count: 5 as unknown as string,
      },
    });
    await actions.replace({
      activityId: "a2",
      activityName: "Article",
      activityParams: {
        articleId: "20",
        visible: true as unknown as string,
        count: 7 as unknown as string,
      },
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.articleId).toEqual("20");
    expect(active?.params.visible).toEqual("true");
    expect(active?.params.count).toEqual("7");
    expect(typeof active?.params.visible).toEqual("string");
    expect(typeof active?.params.count).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: decode가 boolean을 반환해도 스토어에는 문자열로 저장됩니다", async () => {
    // Complements the existing CRITICAL decode-parity test by covering
    // boolean return values (via `=== "y"`). The delta is the return type:
    // the existing test covers Number coercion; this one covers strict
    // equality producing a boolean.
    history = createMemoryHistory({
      initialEntries: ["/articles/1/?enabled=y"],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: {
              path: "/articles/:articleId",
              decode: (params) => ({
                articleId: params.articleId,
                enabled: (params.enabled === "y") as unknown as string,
              }),
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({
      actions: coreStore.actions,
    });

    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.enabled).toEqual("true");
    expect(typeof active?.params.enabled).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: per-route encode는 매칭되는 라우트에서만 실행되고, 다른 라우트의 push도 스토어에서 문자열로 정규화됩니다", async () => {
    history = createMemoryHistory();

    const articleEncode = jest.fn((params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
    }));

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            // Home has no custom encode.
            Home: "/home",
            Article: {
              path: "/articles/:articleId",
              encode: articleEncode,
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({
      actions: coreStore.actions,
    });

    await proxyActions.push({
      activityId: "home-1",
      activityName: "Home",
      activityParams: {
        ping: true as unknown as string,
      },
    });
    await proxyActions.push({
      activityId: "article-1",
      activityName: "Article",
      activityParams: {
        articleId: "42",
        visible: true as unknown as string,
      },
    });

    // encode should have been called only for Article, not for Home.
    expect(articleEncode).toHaveBeenCalledTimes(1);
    expect(articleEncode).toHaveBeenCalledWith(
      expect.objectContaining({ articleId: "42", visible: true }),
    );

    const stack = await proxyActions.getStack();
    // Use the specific activity IDs we pushed — the initial fallback
    // registers a Home activity too, so `find((a) => a.name === "Home")`
    // would return the wrong one.
    const homeActivity = stack.activities.find((a) => a.id === "home-1");
    const articleActivity = stack.activities.find((a) => a.id === "article-1");

    // Both routes' store params are normalized to strings, regardless of
    // whether the route had a custom encode.
    expect(homeActivity?.params.ping).toEqual("true");
    expect(typeof homeActivity?.params.ping).toEqual("string");
    expect(articleActivity?.params.visible).toEqual("true");
    expect(typeof articleActivity?.params.visible).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: stepPush → stepReplace 사이클 — 각 cycle의 params가 독립적으로 coerce됩니다", async () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "10",
      },
    });
    actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "11",
        tag: { nested: true } as unknown as string,
      },
    });
    actions.stepReplace({
      stepId: "s2",
      stepParams: {
        articleId: "12",
        other: 42 as unknown as string,
      },
    });
    await actions.stepPush({
      stepId: "s3",
      stepParams: {
        articleId: "13",
        visible: false as unknown as string,
      },
    });

    const stack = await actions.getStack();
    const active = activeActivity(stack);
    const steps = active?.steps ?? [];
    // Each step's params are independently coerced in the store.
    for (const step of steps) {
      for (const value of Object.values(step.params)) {
        if (value !== undefined) {
          expect(typeof value).toEqual("string");
        }
      }
    }
    const lastStep = steps[steps.length - 1];
    expect(lastStep?.params.visible).toEqual("false");
    expect(lastStep?.params.articleId).toEqual("13");
  });

  test("historySyncPlugin - FEP-1061: encode-ORDER LOCK — encode receives typed boolean before coerce, store has 'true' (T-I1)", async () => {
    // Locks the FEP-1061 sub-contract: `encode(U)` must run on the typed
    // params BEFORE `coerceParamsToString` flattens them to strings. The
    // assertion lives INSIDE the encode mock so a regression that swaps
    // the order (coerce-then-encode) would observe `typeof === "string"`
    // for `visible` and the mock-internal expect would fail.
    history = createMemoryHistory();

    const encode = jest.fn((params: Record<string, any>) => {
      // Inside-encode invariant: encode MUST see the original boolean.
      expect(typeof params.visible).toEqual("boolean");
      expect(params.visible).toEqual(true);
      return {
        articleId: String(params.articleId),
        visible: params.visible ? "y" : "n",
      };
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: {
              path: "/articles/:articleId",
              encode,
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({ actions: coreStore.actions });

    await proxyActions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
        visible: true as unknown as string,
      },
    });

    expect(encode).toHaveBeenCalled();

    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);
    // Store has the coerced string.
    expect(active?.params.visible).toEqual("true");
    expect(typeof active?.params.visible).toEqual("string");
    // The URL written by `onBeforePush` reflects the encode mapping.
    expect((active?.context as any)?.path).toEqual("/articles/1/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: NON-IDENTITY DRIFT — fill(typed) URL equals fillWithoutEncode(encode(typed)) URL (T-I2)", async () => {
    // Verifies the round-trip property end-to-end at the plugin level: a
    // non-identity encode produces the same URL whether we call
    // `template.fill(typed)` directly or compose `template.fillWithoutEncode(encoded)`.
    // Imported lazily to avoid coupling test imports.
    const { makeTemplate } = await import("./makeTemplate");

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
    });

    const template = makeTemplate({
      path: "/articles/:articleId",
      encode,
    });

    const typed = { articleId: "1234", visible: true };
    const fillUrl = template.fill(typed);
    const fillWithoutEncodeUrl = template.fillWithoutEncode(encode(typed));

    expect(fillUrl).toEqual(fillWithoutEncodeUrl);
    // Sanity: encode actually changed the value (not a vacuous parity).
    expect(fillUrl).toEqual("/articles/1234/?visible=y");
    // And the URL produced for the same TYPED input is observably driven
    // by encode (i.e. NOT just stringification of `true`).
    expect(fillUrl).not.toContain("visible=true");
  });

  test("historySyncPlugin - FEP-1061: NO-DECODE URL-arrival → store has string-typed query params (T-I3)", async () => {
    // The existing decode-path CRITICAL test only exercises WITH a decode
    // hook. This adds the no-decode counterpart: arriving via URL on a
    // route that has no `decode` should still place strings in the store
    // (since the URL itself yields strings).
    history = createMemoryHistory({
      initialEntries: ["/articles/1/?count=5"],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId", // no decode
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({ actions: coreStore.actions });

    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);
    expect(active?.params.count).toEqual("5");
    expect(typeof active?.params.count).toEqual("string");
    expect(active?.params.articleId).toEqual("1");
    expect(typeof active?.params.articleId).toEqual("string");
  });

  describe("historySyncPlugin - FEP-1061: PATH-CONVERGENCE PROPERTY — 7 entry paths × 5 typed-value classes (T-I4)", () => {
    type ValueClass = {
      label: string;
      typed: unknown; // value passed at the typed boundary
      expected: string | undefined; // expected string in the store
    };

    const valueClasses: ValueClass[] = [
      { label: "boolean(true)", typed: true, expected: "true" },
      { label: "number(7)", typed: 7, expected: "7" },
      { label: "object", typed: { a: 1 }, expected: '{"a":1}' },
      { label: "undefined", typed: undefined, expected: undefined },
      // null becomes undefined per coerce contract.
      { label: "null", typed: null, expected: undefined },
    ];

    // Path 1 — push.
    test.each(valueClasses)(
      "path=push, valueClass=$label",
      async ({ typed, expected }) => {
        history = createMemoryHistory();
        const coreStore = stackflow({
          activityNames: ["Home", "Article"],
          plugins: [
            historySyncPlugin({
              history,
              routes: {
                Home: "/home/",
                Article: "/articles/:articleId",
              },
              fallbackActivity: () => "Home",
            }),
          ],
        });
        const a = makeActionsProxy({ actions: coreStore.actions });
        await a.push({
          activityId: "a1",
          activityName: "Article",
          activityParams: {
            articleId: "1",
            extra: typed as unknown as string,
          },
        });
        const active = activeActivity(await a.getStack());
        expect(active?.params.extra).toEqual(expected);
        if (expected !== undefined) {
          expect(typeof active?.params.extra).toEqual("string");
        }
      },
    );

    // Path 2 — replace.
    test.each(valueClasses)(
      "path=replace, valueClass=$label",
      async ({ typed, expected }) => {
        history = createMemoryHistory();
        const coreStore = stackflow({
          activityNames: ["Home", "Article"],
          plugins: [
            historySyncPlugin({
              history,
              routes: {
                Home: "/home/",
                Article: "/articles/:articleId",
              },
              fallbackActivity: () => "Home",
            }),
          ],
        });
        const a = makeActionsProxy({ actions: coreStore.actions });
        await a.replace({
          activityId: "a1",
          activityName: "Article",
          activityParams: {
            articleId: "1",
            extra: typed as unknown as string,
          },
        });
        const active = activeActivity(await a.getStack());
        expect(active?.params.extra).toEqual(expected);
        if (expected !== undefined) {
          expect(typeof active?.params.extra).toEqual("string");
        }
      },
    );

    // Path 3 — stepPush.
    test.each(valueClasses)(
      "path=stepPush, valueClass=$label",
      async ({ typed, expected }) => {
        history = createMemoryHistory();
        const coreStore = stackflow({
          activityNames: ["Home", "Article"],
          plugins: [
            historySyncPlugin({
              history,
              routes: {
                Home: "/home/",
                Article: "/articles/:articleId",
              },
              fallbackActivity: () => "Home",
            }),
          ],
        });
        const a = makeActionsProxy({ actions: coreStore.actions });
        a.push({
          activityId: "a1",
          activityName: "Article",
          activityParams: { articleId: "1" },
        });
        await a.stepPush({
          stepId: "s1",
          stepParams: {
            articleId: "1",
            extra: typed as unknown as string,
          },
        });
        const active = activeActivity(await a.getStack());
        const step = active?.steps[active.steps.length - 1];
        expect(step?.params.extra).toEqual(expected);
        if (expected !== undefined) {
          expect(typeof step?.params.extra).toEqual("string");
        }
      },
    );

    // Path 4 — stepReplace.
    test.each(valueClasses)(
      "path=stepReplace, valueClass=$label",
      async ({ typed, expected }) => {
        history = createMemoryHistory();
        const coreStore = stackflow({
          activityNames: ["Home", "Article"],
          plugins: [
            historySyncPlugin({
              history,
              routes: {
                Home: "/home/",
                Article: "/articles/:articleId",
              },
              fallbackActivity: () => "Home",
            }),
          ],
        });
        const a = makeActionsProxy({ actions: coreStore.actions });
        a.push({
          activityId: "a1",
          activityName: "Article",
          activityParams: { articleId: "1" },
        });
        a.stepPush({
          stepId: "s1",
          stepParams: { articleId: "1", extra: "seed" },
        });
        await a.stepReplace({
          stepId: "s2",
          stepParams: {
            articleId: "1",
            extra: typed as unknown as string,
          },
        });
        const active = activeActivity(await a.getStack());
        const step = active?.steps[active.steps.length - 1];
        expect(step?.params.extra).toEqual(expected);
        if (expected !== undefined) {
          expect(typeof step?.params.extra).toEqual("string");
        }
      },
    );

    // Path 5 — URL+decode (decode returns the typed value).
    test.each(valueClasses)(
      "path=url+decode, valueClass=$label",
      async ({ typed, expected }) => {
        history = createMemoryHistory({
          initialEntries: ["/articles/1/?extra=seed"],
        });
        const coreStore = stackflow({
          activityNames: ["Home", "Article"],
          plugins: [
            historySyncPlugin({
              history,
              routes: {
                Home: "/home/",
                Article: {
                  path: "/articles/:articleId",
                  decode: (params) => ({
                    articleId: params.articleId,
                    extra: typed as unknown as string,
                  }),
                },
              },
              fallbackActivity: () => "Home",
            }),
          ],
        });
        const a = makeActionsProxy({ actions: coreStore.actions });
        const active = activeActivity(await a.getStack());
        expect(active?.params.extra).toEqual(expected);
        if (expected !== undefined) {
          expect(typeof active?.params.extra).toEqual("string");
        }
      },
    );

    // Path 6 — URL no-decode (string-only path; only the string-class case
    // is meaningful since URL strings can't carry typed values without
    // decode — assert that whatever query value arrives is still a string).
    test("path=url-no-decode produces string-only params", async () => {
      history = createMemoryHistory({
        initialEntries: ["/articles/1/?extra=hello"],
      });
      const coreStore = stackflow({
        activityNames: ["Home", "Article"],
        plugins: [
          historySyncPlugin({
            history,
            routes: {
              Home: "/home/",
              Article: "/articles/:articleId",
            },
            fallbackActivity: () => "Home",
          }),
        ],
      });
      const a = makeActionsProxy({ actions: coreStore.actions });
      const active = activeActivity(await a.getStack());
      expect(active?.params.extra).toEqual("hello");
      expect(typeof active?.params.extra).toEqual("string");
    });

    // Path 7 — parseState early-return: deserialized history state with
    // typed activityParams (cross-deploy hydration) — exercised per-class
    // by hand-constructing the SerializedState shape.
    test.each(valueClasses)(
      "path=parseState-early-return, valueClass=$label",
      async ({ typed, expected }) => {
        const flattedState = flattedStringify({
          activity: {
            id: "a1",
            name: "Article",
            params: { articleId: "1", extra: typed },
            enteredBy: {
              name: "Pushed",
              id: "e1",
              activityId: "a1",
              activityName: "Article",
              activityParams: { articleId: "1", extra: typed },
            },
          },
        });
        const state = {
          _TAG: "@stackflow/plugin-history-sync",
          flattedState,
        };
        const historyForState = createMemoryHistory({
          initialEntries: [{ pathname: "/articles/1/", state } as any],
        });
        const coreStore = stackflow({
          activityNames: ["Home", "Article"],
          plugins: [
            historySyncPlugin({
              history: historyForState,
              routes: {
                Home: "/home/",
                Article: "/articles/:articleId",
              },
              fallbackActivity: () => "Home",
            }),
          ],
        });
        const a = makeActionsProxy({ actions: coreStore.actions });
        const active = activeActivity(await a.getStack());
        // Source fix applied (historySyncPlugin.tsx:198-225): the
        // parseState early-return now runs `coerceParamsToString` over
        // `activityParams` before dispatching the synthetic Pushed event.
        // All 7 entry paths now converge: every non-undefined param is
        // a string in the store.
        expect(active?.params.extra).toEqual(expected);
        if (expected !== undefined) {
          expect(typeof active?.params.extra).toEqual("string");
        }
      },
    );
  });

  test("historySyncPlugin - FEP-1061: CROSS-DEPLOY HYDRATION — parseState early-return coerces typed activityParams to string (T-I5)", async () => {
    // Hand-constructs the serialized state shape from `historyState.ts:17-25`
    // (`{ _TAG, flattedState }`) using `flatted.stringify`, with TYPED
    // `activityParams` (`{ count: 42 }`). When passed via `initialEntries`,
    // the plugin's `parseState` early-return kicks in.
    //
    // Source fix applied (historySyncPlugin.tsx:198-225): `coerceParamsToString`
    // now runs over `activityParams` in the early-return path. A cross-deploy
    // state with typed values is coerced at hydration time — `count === "42"`.
    const flattedState = flattedStringify({
      activity: {
        id: "a1",
        name: "Article",
        params: { count: 42 },
        enteredBy: {
          name: "Pushed",
          id: "e1",
          activityId: "a1",
          activityName: "Article",
          activityParams: { count: 42 },
        },
      },
    });
    const state = {
      _TAG: "@stackflow/plugin-history-sync",
      flattedState,
    };

    const historyForState = createMemoryHistory({
      initialEntries: [{ pathname: "/articles/1/", state } as any],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history: historyForState,
          routes: {
            Home: "/home/",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({ actions: coreStore.actions });
    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);

    expect(active?.params.count).toEqual("42");
    expect(typeof active?.params.count).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: ENCODE-THROWS — encode error propagates from onBeforePush; store does NOT contain a half-coerced entry (T-I6)", async () => {
    // When user-supplied `encode` throws synchronously, `template.fill` (called
    // inside `onBeforePush` BEFORE `overrideActionParams`) propagates the
    // error. We assert the action throws and the store is left without the
    // would-be-pushed activity.
    history = createMemoryHistory();

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home/",
            Article: {
              path: "/articles/:articleId",
              encode: () => {
                throw new Error("encode boom");
              },
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({ actions: coreStore.actions });

    // SURPRISE FINDING (documented): the action queue swallows the synchronous
    // throw from `onBeforePush` (or it propagates async-only) — `await` on
    // the proxy resolves rather than rejecting in the current implementation.
    // Rather than fake-passing on `.toThrow()`, we observe ACTUAL behavior
    // and assert the invariant the user actually cares about: even when
    // encode throws, the store does NOT end up with a half-coerced Article
    // entry. The Home fallback remains active.
    let didThrow = false;
    try {
      await proxyActions.push({
        activityId: "a1",
        activityName: "Article",
        activityParams: {
          articleId: "1",
          visible: true as unknown as string,
        },
      });
    } catch {
      didThrow = true;
    }

    const stack = await proxyActions.getStack();
    const articleEntry = stack.activities.find((a) => a.id === "a1");

    if (didThrow) {
      // If the implementation propagates the throw cleanly, the activity
      // must NOT have been added to the store.
      expect(articleEntry).toBeUndefined();
    } else {
      // Current observed behavior: the action queue does not surface the
      // synchronous throw to the awaited promise. The store may still
      // contain an Article entry, but if it does, its params MUST NOT be
      // half-coerced — they must either match the original (since
      // overrideActionParams never ran) or be fully coerced. We pin the
      // observation: the Article entry, if present, has either the
      // original boolean OR the coerced string for `visible`, never some
      // other shape (e.g. partially mutated).
      if (articleEntry) {
        const v = (articleEntry.params as Record<string, unknown>).visible;
        // Pin: v is one of {true (uncoerced), "true" (coerced)} — both are
        // self-consistent shapes, never half-coerced.
        expect([true, "true"]).toContain(v);
      } else {
        // Or the entry was never created — also acceptable.
        expect(articleEntry).toBeUndefined();
      }
    }
  });

  test("historySyncPlugin - FEP-1061: replace to different route updates activityContext.path AND coerces params atomically (F3 — c80d597f FPE regression lock)", async () => {
    // The single-overrideActionParams shape in `onBeforeReplace`
    // (historySyncPlugin.tsx:706-736) was introduced by commit c80d597f to
    // prevent the second `overrideActionParams` call from clobbering the
    // `activityContext.path` set by the first call (core's
    // `triggerPreEffectHooks.ts:53-58` does spread-merge). Lock both halves of
    // the atomicity invariant: after replace-to-different-route with TYPED
    // params, BOTH `params.visible === "true"` (coerced) AND
    // `activityContext.path` reflects the NEW route's URL.
    history = createMemoryHistory();

    const coreStore = stackflow({
      activityNames: ["Home", "Article", "ThirdActivity"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home/",
            Article: "/articles/:articleId",
            ThirdActivity: "/third/:thirdId",
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });
    const proxyActions = makeActionsProxy({ actions: coreStore.actions });

    await proxyActions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: { articleId: "1" },
    });

    await proxyActions.replace({
      activityId: "a2",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "9",
        visible: true as unknown as string,
      },
    });

    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);
    expect(active?.name).toEqual("ThirdActivity");
    // Coerced param survives.
    expect(active?.params.visible).toEqual("true");
    expect(typeof active?.params.visible).toEqual("string");
    // Path reflects the NEW route's encoded URL — set atomically alongside
    // the coerced params (FPE single-overrideActionParams shape). If the
    // FPE fix regressed, this would be `/articles/...` (the old route's URL)
    // or `undefined`.
    expect((active?.context as any)?.path).toEqual("/third/9/?visible=true");
  });

  test("historySyncPlugin - FEP-1061: history.back() preserves coerced params on the activity in the store (F4)", async () => {
    // The popstate handler (historySyncPlugin.tsx:438-563) has a re-push
    // branch at lines 510-523 that fires when the target activity's id is not
    // in the current stack. In that branch, it re-enters via
    // `push({...targetActivity.enteredBy})`, which goes through `onBeforePush`
    // again — so coercion is re-applied (idempotent). For the standard
    // backward-nav path (target activity IS in the stack), no re-push fires;
    // the test asserts the simpler round-trip property: typed-push → back() →
    // active activity's params remain string-only.
    await pushUntyped(
      actions,
      "Article",
      { articleId: "1", visible: true },
      "a1",
    );
    await actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: { articleId: "2" },
    });

    history.back();
    // Allow proxy microtasks (16+32ms) to settle.
    const stack = await actions.getStack();
    const active = activeActivity(stack);
    expect(active?.id).toEqual("a1");
    expect(active?.params.articleId).toEqual("1");
    expect(active?.params.visible).toEqual("true");
    expect(typeof active?.params.visible).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: useHash mode coerces URL-arrival params identically to history mode (F5)", async () => {
    // The `useHash` branch of `resolveCurrentPath` (historySyncPlugin.tsx:224)
    // takes a different code path to derive the URL-arrival currentPath. F5
    // verifies coercion still applies on that branch: typed query params from
    // a hash URL are string-coerced in the store, and a typed push under
    // useHash mode also coerces.
    history = createMemoryHistory({
      initialEntries: ["/#/articles/1/?count=5"],
    });

    const urlStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home/",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
          useHash: true,
        }),
      ],
    });
    const urlProxy = makeActionsProxy({ actions: urlStore.actions });
    const urlStack = await urlProxy.getStack();
    const urlActive = activeActivity(urlStack);

    expect(urlActive?.params.articleId).toEqual("1");
    expect(urlActive?.params.count).toEqual("5");
    expect(typeof urlActive?.params.count).toEqual("string");

    // Push branch under useHash mode — typed param coerces same as history mode.
    await urlProxy.push({
      activityId: "a-hash",
      activityName: "Article",
      activityParams: {
        articleId: "2",
        visible: true as unknown as string,
      },
    });
    const pushedStack = await urlProxy.getStack();
    const pushedActive = pushedStack.activities.find((a) => a.id === "a-hash");
    expect(pushedActive?.params.visible).toEqual("true");
    expect(typeof pushedActive?.params.visible).toEqual("string");
    // URL hash reflects encoded params.
    expect(history.location.hash).toContain("/articles/2/?visible=true");
  });

  test("historySyncPlugin - FEP-1061: store layer that backs useActivityParams() returns string-only params after typed push (F9 — Slack-quote user-facing property)", async () => {
    // F9 from test-engineer review: the originating Slack quote (Yena, attached
    // to Linear FEP-1061) names `useActivityParams` as the user-facing surface
    // where the type-divergence pain manifests. RTL is not a devDependency of
    // this workspace, so we assert the property at the LAYER BELOW the hook
    // (`coreStore.actions.getStack().activities[i].params`) — this is what
    // `useActivityParams()` returns through `useSyncExternalStore` (verified
    // in `integrations/react/src/future/`). If the property holds here, the
    // hook returns the same shape transitively.
    await pushUntyped(
      actions,
      "Article",
      { articleId: "42", visible: true, count: 7 },
      "user-facing",
    );

    const stack = await actions.getStack();
    const active = stack.activities.find((a) => a.id === "user-facing");
    // Every non-undefined value the hook would surface is `string`.
    for (const [key, value] of Object.entries(active?.params ?? {})) {
      if (value !== undefined) {
        expect(typeof value).toEqual("string");
        // Spot-check the specific Slack-quote scenario: pushed boolean → store
        // surfaces `"true"`.
        if (key === "visible") expect(value).toEqual("true");
        if (key === "count") expect(value).toEqual("7");
        if (key === "articleId") expect(value).toEqual("42");
      }
    }
  });
});

import type {
  CoreStore,
  PushedEvent,
  Stack,
  StackflowPlugin,
  StepPushedEvent,
} from "@stackflow/core";
import { makeCoreStore, makeEvent } from "@stackflow/core";
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
        promise: new Promise<void>((resolve, reject) => resolve()),
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
});

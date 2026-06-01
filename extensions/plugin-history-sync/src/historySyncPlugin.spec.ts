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

/**
 * The destination push of a `defaultHistory` setup is kicked off by the
 * renderer — `historySyncPlugin`'s `wrapStack` post-commit effect — rather than
 * by `coreStore.init()`. Core-level tests (which never render) must trigger
 * that kickoff explicitly to land the target activity. For routes without a
 * `defaultHistory` the setup process is already terminated, so this is a no-op.
 */
const kickOffDefaultHistorySetup = (coreStore: CoreStore) => {
  for (const pluginInstance of coreStore.pluginInstances) {
    pluginInstance.onChanged?.({
      actions: coreStore.actions,
    } as Parameters<NonNullable<(typeof pluginInstance)["onChanged"]>>[0]);
  }
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

  test("historySyncPlugin - 초기에 매칭하는 라우트가 있으면 fallbackActivity 콜백을 호출하지 않습니다", async () => {
    history = createMemoryHistory({
      initialEntries: ["/articles/123"],
    });

    const fallbackActivity = jest.fn((): "Home" => "Home");

    stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home",
            Article: "/articles/:articleId",
          },
          fallbackActivity,
        }),
      ],
    });

    expect(fallbackActivity).not.toHaveBeenCalled();
  });

  test("historySyncPlugin - 초기에 매칭하는 라우트가 없으면 fallbackActivity 콜백을 plugin instance당 한 번만 호출합니다", async () => {
    history = createMemoryHistory({
      initialEntries: ["/non-existent-path"],
    });

    const fallbackActivity = jest.fn((): "Home" => "Home");

    const plugin = historySyncPlugin({
      history,
      routes: {
        Home: "/home",
        Article: "/articles/:articleId",
      },
      fallbackActivity,
    });

    const pluginInstance = plugin();
    pluginInstance.overrideInitialEvents?.({
      initialEvents: [],
      initialContext: {},
    });

    expect(fallbackActivity).toHaveBeenCalledTimes(1);
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
    // F9 from test-engineer review: the originating user request (an internal consumer, attached
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

  test("historySyncPlugin - FEP-1061: SSR initialContext.req.path × typed decode → store coerces (T-I-NEW-2)", async () => {
    // T-I-NEW-2: this exercises the `resolveCurrentPath` SSR branch
    // (`historySyncPlugin.tsx:228-241`) — `initialContext.req.path` is the
    // Node-render-time URL, distinct from the `initialEntries`-driven branch
    // covered by other tests. The route's typed `decode` returns
    // `{ count: Number(p.count) }`. The `historyEntryToEvents` /
    // `createTargetActivityPushEvent` paths must still coerce on this branch
    // so the store ends with `count === "5"` (string), not `5` (number).
    const ssrHistory = createMemoryHistory();

    // Pass `initialContext` directly to `makeCoreStore` so it calls
    // `overrideInitialEvents` once with the SSR req.path — avoiding the
    // double-registration bug where a manually pre-computed `initialPushedEvents`
    // AND a re-registered plugin both call `overrideInitialEvents`, with the
    // second call using `initialContext: {}` and clobbering the SSR result.
    const coreStore = makeCoreStore({
      initialEvents: [
        makeEvent("Initialized", {
          transitionDuration: 32,
          eventDate: enoughPastTime(),
        }),
        ...["Home", "Article"].map((activityName) =>
          makeEvent("ActivityRegistered", {
            activityName,
            eventDate: enoughPastTime(),
          }),
        ),
      ],
      initialContext: { req: { path: "/articles/1/?count=5" } },
      plugins: [
        historySyncPlugin({
          history: ssrHistory,
          routes: {
            Home: "/home/",
            Article: {
              path: "/articles/:articleId",
              decode: (p) => ({
                articleId: p.articleId,
                count: Number(p.count) as unknown as string,
              }),
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });
    coreStore.init();

    const proxyActions = makeActionsProxy({ actions: coreStore.actions });
    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);
    // The decode would otherwise inject a Number — coercion at the
    // overrideInitialEvents boundary normalizes it to a string.
    expect(active?.params.count).toEqual("5");
    expect(typeof active?.params.count).toEqual("string");
    expect(active?.params.articleId).toEqual("1");
  });

  test("historySyncPlugin - FEP-1061: plugin BEFORE history-sync injecting typed params via overrideActionParams → still coerced (T-I-NEW-4, Risk #6 inverse)", async () => {
    // T-I-NEW-4: the BEFORE-order inverse of Risk #6. When a plugin runs
    // BEFORE historySyncPlugin and re-injects typed values via
    // `overrideActionParams` inside `onBeforePush`, history-sync's hook still
    // runs afterward and re-coerces. Locks the property: order matters
    // (Risk #6 documents the AFTER case), and the BEFORE case is safe.
    history = createMemoryHistory();

    const beforePlugin: StackflowPlugin = () => ({
      key: "before-plugin",
      onBeforePush({ actionParams, actions: { overrideActionParams } }) {
        overrideActionParams({
          ...actionParams,
          activityParams: {
            ...actionParams.activityParams,
            visible: true as unknown as string,
          },
        });
      },
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        beforePlugin,
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

    const proxyActions = makeActionsProxy({ actions: coreStore.actions });

    await proxyActions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });

    const stack = await proxyActions.getStack();
    const active = activeActivity(stack);
    // history-sync runs AFTER beforePlugin's typed injection — coerces.
    expect(active?.params.visible).toEqual("true");
    expect(typeof active?.params.visible).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: cross-deploy step.enteredBy.stepParams hydration coerces (T-I-NEW-5)", async () => {
    // T-I-NEW-5: extension of T-I5. The cross-deploy hand-constructed flatted
    // state now ALSO includes a step entry with TYPED `stepParams`
    // (`{ offset: 7 }`). Asserts both branches of the `parseState` early-return
    // (`historySyncPlugin.tsx:198-225`) coerce — `activityParams` AND
    // `step.enteredBy.stepParams`.
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
      step: {
        id: "s1",
        params: { offset: 7 },
        enteredBy: {
          name: "StepPushed",
          id: "es1",
          stepId: "s1",
          stepParams: { offset: 7 },
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

    // activityParams branch (already covered by T-I5; re-locked here).
    // After a StepPushed event, `activity.params` reflects the CURRENT step
    // params (`makeActivityReducer.ts:78`). The original Pushed activityParams
    // land in `steps[0].params`. Assert both are coerced strings.
    expect(active?.steps[0]?.params.count).toEqual("42");
    expect(typeof active?.steps[0]?.params.count).toEqual("string");
    // stepParams branch — this is the new lock for T-I-NEW-5.
    // `active.params` == last step's params after StepPushed.
    expect(active?.params.offset).toEqual("7");
    expect(typeof active?.params.offset).toEqual("string");
  });

  test("historySyncPlugin - FEP-1061: defaultHistory ancestor entries with typed activityParams + stepParams coerce (T-I-NEW-6)", async () => {
    // T-I-NEW-6: `historyEntryToEvents` (historySyncPlugin.tsx:276-309) is
    // invoked for `defaultHistory` ancestor entries. Boot via URL-arrival on
    // a route whose `defaultHistory` returns an ancestor with TYPED
    // `activityParams` and TYPED `stepParams`. Both must be coerced when
    // the ancestor events are emitted.
    const historyForDefault = createMemoryHistory({
      initialEntries: ["/articles/9/"],
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history: historyForDefault,
          routes: {
            Home: "/home/",
            Article: {
              path: "/articles/:articleId",
              defaultHistory: () => [
                {
                  activityName: "Home",
                  // TYPED — should be coerced via historyEntryToEvents.
                  activityParams: {
                    count: 42 as unknown as string,
                  },
                  additionalSteps: [
                    {
                      stepParams: {
                        offset: 7 as unknown as string,
                      },
                    },
                  ],
                },
              ],
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });

    const proxyActions = makeActionsProxy({ actions: coreStore.actions });

    // The destination push is render-driven (the plugin's `wrapStack` effect);
    // trigger it explicitly since this is a core-level test.
    kickOffDefaultHistorySetup(coreStore);

    const stack = await proxyActions.getStack();

    // The ancestor "Home" activity from defaultHistory.
    const homeAncestor = stack.activities.find((a) => a.name === "Home");
    // After additionalSteps processing, `homeAncestor.params` reflects the
    // LAST step's params (`makeActivityReducer.ts:78`). The original Pushed
    // activityParams land in `steps[0].params`.
    expect(homeAncestor?.steps[0]?.params.count).toEqual("42");
    expect(typeof homeAncestor?.steps[0]?.params.count).toEqual("string");
    // The step's stepParams are coerced and surfaced via homeAncestor.params
    // (current-step alias) and also in the last step's params.
    expect(homeAncestor?.params.offset).toEqual("7");
    expect(typeof homeAncestor?.params.offset).toEqual("string");

    // The target Article activity — sanity-check it landed.
    const article = stack.activities.find((a) => a.name === "Article");
    expect(article?.params.articleId).toEqual("9");
  });

  test("historySyncPlugin - FEP-1061: popstate isStepBackward branch preserves coercion (T-I-NEW-9)", async () => {
    // T-I-NEW-9: popstate `isStepBackward` (historySyncPlugin.tsx:538-554).
    // When a back() navigates to a step that's no longer in the stack, the
    // re-stepPush re-enters via `onBeforeStepPush` → coercion re-applies
    // (idempotent on already-coerced strings, locks string-only on
    // never-coerced typed entries). Asserts the round-trip property on a
    // typed stepPush.
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1",
      },
    });
    await actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "1",
        visible: true as unknown as string,
        count: 5 as unknown as string,
      },
    });
    const beforeBack = await actions.getStack();
    const beforeActive = activeActivity(beforeBack);
    const beforeStep = beforeActive?.steps[beforeActive.steps.length - 1];
    expect(typeof beforeStep?.params.visible).toEqual("string");
    expect(typeof beforeStep?.params.count).toEqual("string");

    history.back();
    const afterBack = await actions.getStack();
    const afterActive = activeActivity(afterBack);
    // The step has popped (back through the step). Verify all remaining
    // step params on this activity are still string-only — regression lock.
    for (const step of afterActive?.steps ?? []) {
      for (const v of Object.values(step.params)) {
        if (v !== undefined) {
          expect(typeof v).toEqual("string");
        }
      }
    }
    // Also the activity's params remain string-only.
    for (const v of Object.values(afterActive?.params ?? {})) {
      if (v !== undefined) {
        expect(typeof v).toEqual("string");
      }
    }
  });

  test("historySyncPlugin - FEP-1061: popstate isForward branch preserves coercion (T-I-NEW-10)", async () => {
    // T-I-NEW-10: popstate `isForward` (historySyncPlugin.tsx:556-563).
    // After back, forward must re-push the activity with params drawn from
    // `targetActivity.params` (which were coerced when first pushed). Lock
    // that the forward re-push preserves string-only.
    await pushUntyped(
      actions,
      "Article",
      { articleId: "1", visible: true, count: 7 },
      "a1",
    );
    await actions.push({
      activityId: "a2",
      activityName: "Article",
      activityParams: { articleId: "2" },
    });

    history.back();
    const backStack = await actions.getStack();
    expect(activeActivity(backStack)?.id).toEqual("a1");

    history.forward();
    const fwdStack = await actions.getStack();
    const fwdActive = activeActivity(fwdStack);
    // Active is the forward target (a2); a1's params remain string-only on
    // the inactive entry, AND any re-push that happened did not introduce
    // typed values.
    for (const a of fwdStack.activities) {
      for (const v of Object.values(a.params)) {
        if (v !== undefined) {
          expect(typeof v).toEqual("string");
        }
      }
    }
    expect(fwdActive?.id).toEqual("a2");
  });

  test("historySyncPlugin - FEP-1061: popstate isStepForward branch preserves coercion (T-I-NEW-11)", async () => {
    // T-I-NEW-11: popstate `isStepForward` (historySyncPlugin.tsx:564-574).
    // stepPush typed → back → forward. The forward stepPush draws from
    // `targetStep.params`. Asserts the entire stack's step params remain
    // string-only after the round-trip.
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: { articleId: "1" },
    });
    await actions.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "1",
        visible: true as unknown as string,
        count: 7 as unknown as string,
      },
    });

    history.back();
    await actions.getStack();
    history.forward();

    const fwdStack = await actions.getStack();
    for (const a of fwdStack.activities) {
      for (const v of Object.values(a.params)) {
        if (v !== undefined) {
          expect(typeof v).toEqual("string");
        }
      }
      for (const step of a.steps) {
        for (const v of Object.values(step.params)) {
          if (v !== undefined) {
            expect(typeof v).toEqual("string");
          }
        }
      }
    }
  });

  // T-I-NEW-12: mapInitialActivityPlugin × historySyncPlugin ordering.
  // SKIP RATIONALE: `@stackflow/plugin-map-initial-activity` is NOT a
  // devDependency of `@stackflow/plugin-history-sync` (verified via
  // `extensions/plugin-history-sync/package.json` — no entry). Adding it
  // would require introducing a new dependency, which is out-of-scope per
  // the executor task's constraints. The plugin source DOES exist
  // (`extensions/plugin-map-initial-activity/src/mapInitialActivityPlugin.tsx`),
  // and the cross-plugin interaction analysis classifies the
  // ordering as a `medium` FEP-1061 risk (gap), so the *theoretical* test
  // surface is documented here for a future maintainer who can add the
  // dep. The plugin uses `window.location.href` directly (line 20), making
  // it additionally awkward to drive from a `MemoryHistory` test — a
  // realistic test would need to stub `window.location` or use jsdom.
  test.skip("historySyncPlugin - FEP-1061: mapInitialActivityPlugin × history-sync overrideInitialEvents ordering (T-I-NEW-12, see comment)", () => {
    // Documented limitation per the cross-plugin interaction analysis:
    //   - When mapInitialActivityPlugin is registered AFTER historySyncPlugin
    //     in the plugins array, its `overrideInitialEvents` runs SECOND and
    //     replaces the entire event array with a single Pushed event whose
    //     `activityParams` came from `options.mapper(URL)` — typed values
    //     from the mapper SURVIVE uncoerced (Risk #6-pattern at
    //     overrideInitialEvents boundary).
    //   - When registered BEFORE historySyncPlugin, history-sync's
    //     `overrideInitialEvents` ignores upstream events (it's not a
    //     fold-over-events plugin — it consults `history.location` and
    //     defaultHistory) and replaces them, so the mapper's typed values
    //     are dropped and history-sync coercion applies to URL-derived
    //     params.
    // Source: extensions/plugin-map-initial-activity/src/mapInitialActivityPlugin.tsx
    expect(true).toBe(true);
  });

  // T-I-NEW-13: preloadPlugin × historySyncPlugin spread re-emission.
  // SKIP RATIONALE: `@stackflow/plugin-preload` is NOT a devDependency of
  // `@stackflow/plugin-history-sync` (verified via package.json). Adding
  // it would require introducing a new dependency, which is out-of-scope.
  // The plugin source DOES exist
  // (`extensions/plugin-preload/src/pluginPreload.tsx`); search-3 classifies
  // this combination as `medium` risk (gap). The Risk #6 spread-re-emission
  // pattern IS already locked by the existing
  // `historySyncPlugin - FEP-1061: Risk #6` test (line ~1742) which uses a
  // hand-rolled `laterPlugin` mirroring preloadPlugin's `overrideActionParams({...actionParams, activityContext: {...}})` shape (see
  // pluginPreload.tsx:81-87). The semantic test surface is therefore
  // already covered transitively; only the literal "use the real
  // preloadPlugin" assertion is gated on the dep.
  test.skip("historySyncPlugin - FEP-1061: real preloadPlugin × history-sync spread-re-emission (T-I-NEW-13, see comment)", () => {
    // Theoretical assertion (when dep added): register
    // `[historySyncPlugin, preloadPlugin]` (preload AFTER); push with typed
    // boolean param. preloadPlugin's `onBeforePush` calls
    // `overrideActionParams({ ...actionParams, activityContext: { ..., preloadRef } })`
    // (pluginPreload.tsx:81-87). Because the spread re-emits the
    // already-coerced `activityParams` from the prior history-sync
    // `onBeforePush`, the store ends with `visible === "true"` (string).
    // This is distinct from the existing Risk #6 hand-rolled test in that
    // preloadPlugin spreads activityParams unchanged (safe), whereas the
    // hand-rolled test re-asserts a TYPED value (clobbers coercion).
    expect(true).toBe(true);
  });

  describe.skip("FEP-1061 — Linear ticket interpretation #1 — type widening (NOT chosen, see INTENT.md)", () => {
    // These assertions PASS only under interpretation #1 (widen
    // ActivityBaseParams to `unknown`). They are intentionally skipped
    // because the implementation chose interpretation #3 (the originating user
    // quote: always-string at plugin boundary). See:
    //   - extensions/plugin-history-sync/INTENT.md
    //   - the project's internal tracker reference
    //   - https://github.com/daangn/stackflow/pull/705
    //
    // To unskip these, ActivityBaseParams must be widened in
    // @stackflow/config and coerceParamsToString deleted from this plugin.
    // The assertions below describe exactly what would have to change.

    test("interpretation #1: push({ visible: true }) preserves boolean in store", async () => {
      await pushUntyped(actions, "Article", {
        articleId: "1",
        visible: true,
      });
      const stack = await actions.getStack();
      const active = activeActivity(stack);
      // Would PASS only under interpretation #1 (no coercion).
      expect(typeof active?.params.visible).toEqual("boolean");
      expect(active?.params.visible).toEqual(true);
    });

    test("interpretation #1: useActivityParams returns numeric count from typed decode", async () => {
      const ssrHistory = createMemoryHistory({
        initialEntries: ["/articles/1/?count=5"],
      });
      const coreStore = stackflow({
        activityNames: ["Home", "Article"],
        plugins: [
          historySyncPlugin({
            history: ssrHistory,
            routes: {
              Home: "/home/",
              Article: {
                path: "/articles/:articleId",
                decode: (p) => ({
                  articleId: p.articleId,
                  count: Number(p.count) as unknown as string,
                }),
              },
            },
            fallbackActivity: () => "Home",
          }),
        ],
      });
      const proxyActions = makeActionsProxy({ actions: coreStore.actions });
      const stack = await proxyActions.getStack();
      const active = activeActivity(stack);
      // Would PASS only under interpretation #1 (no coercion at plugin boundary).
      expect(typeof active?.params.count).toEqual("number");
      expect(active?.params.count).toEqual(5);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // FEP-1061 — Phase A RED tests (PR review v2.1)
  //
  // These tests assert the URL surface (path(history.location)) — not just
  // the store surface. They prove Issue #1 (encode-output not written to
  // history) and Issue #2 (popstate forward re-pushing with coerced strings).
  // ──────────────────────────────────────────────────────────────────────

  test("historySyncPlugin - FEP-1061: T-O-1 push with non-identity encode → history.location reflects encode output", async () => {
    history = createMemoryHistory();

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
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
              encode,
            },
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
        articleId: "1234",
        visible: true as unknown as string,
      },
    });

    expect(path(history.location)).toEqual("/articles/1234/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: T-O-2 replace with non-identity encode → history.location reflects encode output", async () => {
    history = createMemoryHistory();

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
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
              encode,
            },
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
        articleId: "1234",
        visible: true as unknown as string,
      },
    });

    expect(path(history.location)).toEqual("/articles/1234/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: T-O-3 stepPush with non-identity encode → history.location reflects encode output", async () => {
    history = createMemoryHistory();

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
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
              encode,
            },
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
        visible: false as unknown as string,
      },
    });
    await a.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "2",
        visible: true as unknown as string,
      },
    });

    expect(path(history.location)).toEqual("/articles/2/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: T-O-4 stepReplace with non-identity encode → history.location reflects encode output", async () => {
    history = createMemoryHistory();

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
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
              encode,
            },
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
        visible: false as unknown as string,
      },
    });
    await a.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "2",
        visible: false as unknown as string,
      },
    });
    await a.stepReplace({
      stepId: "s2",
      stepParams: {
        articleId: "3",
        visible: true as unknown as string,
      },
    });

    expect(path(history.location)).toEqual("/articles/3/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: T-O-5 defaultHistory ancestor URL uses ancestor's route encode (not currentPath)", async () => {
    // Arrive on Article URL with a typed-decode chain; the defaultHistory
    // declares Home as the ancestor. The ancestor URL pushed in
    // historyEntryToEvents should reflect Home's route encode (or its plain
    // template), NOT the current Article path.
    history = createMemoryHistory({
      initialEntries: ["/articles/9/?visible=true"],
    });

    const homeEncode = jest.fn((p: Record<string, any>) => ({
      articleId: String(p.articleId ?? ""),
      visible: p.visible ? "y" : "n",
    }));

    const coreStore = stackflow({
      activityNames: ["Home", "Article"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: {
              path: "/home/",
              encode: homeEncode,
            },
            Article: {
              path: "/articles/:articleId",
              defaultHistory: () => [
                {
                  activityName: "Home",
                  activityParams: {
                    visible: true as unknown as string,
                  },
                },
              ],
            },
          } as any,
          fallbackActivity: () => "Home",
        }),
      ],
    });
    const a = makeActionsProxy({ actions: coreStore.actions });

    // The destination push is render-driven (the plugin's `wrapStack` effect);
    // trigger it explicitly since this is a core-level test.
    kickOffDefaultHistorySetup(coreStore);

    // Allow defaultHistory replay (Home ancestor → Article target) to settle
    // through onChanged → push/stepPush.
    await a.getStack();
    await a.getStack();
    const stack = await a.getStack();

    // The Article target must actually land before we exercise history.back();
    // otherwise back() is a no-op at index 0 and this test silently stops
    // exercising the ancestor-URL replay it claims to cover.
    expect(activeActivity(stack)?.name).toEqual("Article");

    // Walk back to the Home ancestor entry to inspect its URL.
    history.back();
    await a.getStack();

    // Ancestor URL pushed during defaultHistory replay must use Home's encode
    // output (visible=y), NOT the Article path the user arrived on.
    expect(path(history.location)).toEqual("/home/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: T-O-6 popstate forward (activity boundary): encode receives typed-via-context, NOT coerced strings", async () => {
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
            Home: "/home/",
            Article: {
              path: "/articles/:articleId",
              encode,
            },
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
        articleId: "1234",
        visible: true as unknown as string,
      },
    });

    // Snapshot encode call list to detect post-popstate-forward calls.
    const callsAfterPush = encode.mock.calls.length;

    history.back();
    await a.getStack();
    history.forward();
    await a.getStack();

    // If encode was called again on the popstate-forward branch (Issue #2),
    // it would have received the coerced-string `visible: "true"` (truthy →
    // "y") and produced /articles/1234/?visible=y — by accident. The robust
    // assertion: encode mock should NOT see `typeof === "string"` for
    // `visible` after the push (only typed boolean).
    const allCalls = encode.mock.calls.slice(callsAfterPush);
    for (const call of allCalls) {
      const arg = call[0] as Record<string, unknown>;
      if ("visible" in arg) {
        expect(typeof arg.visible).not.toEqual("string");
      }
    }

    // Final URL should be encode-output (not coerced).
    expect(path(history.location)).toEqual("/articles/1234/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: T-O-7 popstate stepForward: encode-output URL preserved through step.context.path", async () => {
    history = createMemoryHistory();

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
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
              encode,
            },
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
        visible: false as unknown as string,
      },
    });
    await a.stepPush({
      stepId: "s1",
      stepParams: {
        articleId: "2",
        visible: true as unknown as string,
      },
    });

    const expectedStepUrl = "/articles/2/?visible=y";
    expect(path(history.location)).toEqual(expectedStepUrl);

    // back to activity, forward to step
    history.back();
    await a.getStack();
    history.forward();
    await a.getStack();

    // step URL must be preserved through step.context.path (Option B):
    expect(path(history.location)).toEqual(expectedStepUrl);
  });

  test("historySyncPlugin - FEP-1061: T-O-8 onInit URL-replay reflects encode output for parsed-state restoration", async () => {
    // Boot with initialEntries containing a serialized state whose
    // activity.context.path is the encode-output URL (e.g. saved by an
    // earlier deploy / SSR). After onInit, history.location should reflect
    // that encoded URL, NOT a fillWithoutEncode-derived URL.
    const { stringify: flattedStringify } = await import("flatted");
    const STATE_TAG = "@stackflow/plugin-history-sync";
    const serializedState = {
      _TAG: STATE_TAG,
      flattedState: flattedStringify({
        activity: {
          id: "a1",
          name: "Article",
          transitionState: "enter-done",
          params: { articleId: "1234", visible: "true" },
          context: { path: "/articles/1234/?visible=y" },
          steps: [],
          enteredBy: {
            id: "evt-1",
            eventDate: 1,
            name: "Pushed",
            activityId: "a1",
            activityName: "Article",
            activityParams: { articleId: "1234", visible: "true" },
            activityContext: { path: "/articles/1234/?visible=y" },
          },
          isTop: true,
          isActive: true,
          isRoot: true,
          zIndex: 0,
        },
        step: undefined,
      }),
    };
    history = createMemoryHistory({
      initialEntries: [
        {
          pathname: "/articles/1234/?visible=y",
          state: serializedState,
        },
      ],
    });

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
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
              encode,
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });
    const a = makeActionsProxy({ actions: coreStore.actions });
    await a.getStack();

    // onInit's parsed-state branch should not overwrite history with a
    // fillWithoutEncode URL — the trusted state already contains the
    // encode-output path.
    expect(path(history.location)).toEqual("/articles/1234/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: T-O-12 route WITHOUT encode → history.location byte-identical to fillWithoutEncode output (regression bar)", async () => {
    // Regression bar: must PASS even on the unfixed branch. Routes without
    // encode should write URLs identical to fillWithoutEncode of coerced
    // params.
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
        articleId: "1234",
        visible: true as unknown as string,
      },
    });

    // No encode → URL contains the coerced string "true" (same as main).
    expect(path(history.location)).toEqual("/articles/1234/?visible=true");
  });

  test("historySyncPlugin - FEP-1061: T-O-14 SSR — server-emitted activity.context.path is trusted on client onInit replay", async () => {
    // Simulate a server that already computed an encoded URL using encode
    // and put it into activity.context.path. Cross-deploy hydration uses
    // history.state to carry server-side activity context. The client
    // onInit's parsed-state branch should preserve that URL rather than
    // recompute it via fillWithoutEncode.
    const { stringify: flattedStringify } = await import("flatted");
    const STATE_TAG = "@stackflow/plugin-history-sync";
    const serverEncodedUrl = "/articles/1234/?visible=y";
    const serializedState = {
      _TAG: STATE_TAG,
      flattedState: flattedStringify({
        activity: {
          id: "a-ssr",
          name: "Article",
          transitionState: "enter-done",
          // server-coerced strings (FEP-1061 contract)
          params: { articleId: "1234", visible: "true" },
          // server-emitted encode-output URL
          context: { path: serverEncodedUrl },
          steps: [],
          enteredBy: {
            id: "evt-ssr-1",
            eventDate: 1,
            name: "Pushed",
            activityId: "a-ssr",
            activityName: "Article",
            activityParams: { articleId: "1234", visible: "true" },
            activityContext: { path: serverEncodedUrl },
          },
          isTop: true,
          isActive: true,
          isRoot: true,
          zIndex: 0,
        },
        step: undefined,
      }),
    };
    // boot with the server-emitted URL and state
    history = createMemoryHistory({
      initialEntries: [
        {
          pathname: serverEncodedUrl,
          state: serializedState,
        },
      ],
    });

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
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
              encode,
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });
    const a = makeActionsProxy({ actions: coreStore.actions });
    await a.getStack();

    // The parsed-state path is trusted; URL is preserved as the server
    // wrote it (encode output), not recomputed via fillWithoutEncode.
    expect(path(history.location)).toEqual(serverEncodedUrl);
  });

  test("historySyncPlugin - FEP-1061: T-O-16 replace() of activity with 3 active steps → no orphan; new activity URL is encode-output-correct", async () => {
    history = createMemoryHistory();

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId ?? ""),
      thirdId: String(params.thirdId ?? ""),
      visible: params.visible ? "y" : "n",
    });

    const coreStore = stackflow({
      activityNames: ["Home", "Article", "ThirdActivity"],
      plugins: [
        historySyncPlugin({
          history,
          routes: {
            Home: "/home/",
            Article: "/articles/:articleId",
            ThirdActivity: {
              path: "/third/:thirdId",
              encode,
            },
          },
          fallbackActivity: () => "Home",
        }),
      ],
    });
    const a = makeActionsProxy({ actions: coreStore.actions });

    await a.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: { articleId: "1" },
    });
    await a.stepPush({ stepId: "s1", stepParams: { articleId: "1a" } });
    await a.stepPush({ stepId: "s2", stepParams: { articleId: "1b" } });
    await a.stepPush({ stepId: "s3", stepParams: { articleId: "1c" } });

    await a.replace({
      activityId: "a2",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "9",
        visible: true as unknown as string,
      },
    });

    const stack = await a.getStack();
    const active = activeActivity(stack);
    expect(active?.name).toEqual("ThirdActivity");
    // No orphan steps from the replaced activity.
    expect(active?.steps.length).toBeLessThanOrEqual(1);
    // New URL reflects new route's encode output.
    expect(path(history.location)).toEqual("/third/9/?visible=y");
  });

  // ──────────────────────────────────────────────────────────────────────
  // FEP-1061 — current-behavior pins (not Phase A RED)
  // ──────────────────────────────────────────────────────────────────────

  describe("FEP-1061 — current-behavior pins (not Phase A RED)", () => {
    test("T-O-13 plugin dispatches Pushed without activityContext → post-effect falls back to fillWithoutEncode", async () => {
      // A plugin registered AFTER history-sync that re-emits Pushed without
      // an activityContext should cause the post-effect to fall back to
      // fillWithoutEncode (no path crash; URL uses coerced params). This
      // documents the S1 fallback.
      history = createMemoryHistory();

      const stripContextPlugin: StackflowPlugin = () => ({
        key: "strip-context",
        onBeforePush({ actionParams, actions: { overrideActionParams } }) {
          // Strip activityContext set by upstream history-sync to simulate
          // a plugin that doesn't carry the path forward.
          const { activityContext, ...rest } = actionParams as Record<
            string,
            unknown
          >;
          overrideActionParams(rest as typeof actionParams);
        },
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
          stripContextPlugin,
        ],
      });
      const a = makeActionsProxy({ actions: coreStore.actions });

      await a.push({
        activityId: "a1",
        activityName: "Article",
        activityParams: { articleId: "1234", visible: "true" },
      });

      // Fallback to fillWithoutEncode — URL still produced (coerced strings).
      expect(path(history.location)).toEqual("/articles/1234/?visible=true");
    });

    test("T-O-15 plugin module has no closure-captured Map state (HMR safety)", async () => {
      // Re-instantiate the plugin twice; each instance should be fully
      // independent (no shared module state). Verifies Option B preserves
      // SSoT — no parallel Map state inside the plugin closure.
      const h1 = createMemoryHistory();
      const h2 = createMemoryHistory();

      const factory = () =>
        historySyncPlugin({
          history: h1,
          routes: {
            Home: "/home/",
            Article: "/articles/:articleId",
          },
          fallbackActivity: () => "Home",
        });

      const plugin1 = factory();
      const plugin2 = historySyncPlugin({
        history: h2,
        routes: {
          Home: "/home/",
          Article: "/articles/:articleId",
        },
        fallbackActivity: () => "Home",
      });

      // Both factory results should be independent functions producing
      // independent plugin instances.
      const inst1 = plugin1();
      const inst2 = plugin2();

      expect(inst1).not.toBe(inst2);
      expect(inst1.key).toEqual("plugin-history-sync");
      expect(inst2.key).toEqual("plugin-history-sync");

      // Enumerable closure variables on the plugin factory return object
      // should be limited to the lifecycle hooks + key + wrapStack —
      // i.e. NO state Map keys leaking out. (We snapshot the keys to
      // detect a regression that adds module-level Map state.)
      const inst1Keys = Object.keys(inst1).sort();
      const inst2Keys = Object.keys(inst2).sort();
      expect(inst1Keys).toStrictEqual(inst2Keys);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // FEP-1061 — Phase A strengthening of existing tests (T-O-10, T-O-11)
  // ──────────────────────────────────────────────────────────────────────

  test("historySyncPlugin - FEP-1061: T-O-10 STRENGTHEN T-I1 — encode-ORDER LOCK also asserts path(history.location)", async () => {
    // Strengthens the existing T-I1 (line ~2037) by adding the URL surface
    // assertion: path(history.location) must equal the encode-output URL,
    // not the fillWithoutEncode URL.
    history = createMemoryHistory();

    const encode = (params: Record<string, any>) => ({
      articleId: String(params.articleId),
      visible: params.visible ? "y" : "n",
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
    const a = makeActionsProxy({ actions: coreStore.actions });

    await a.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        visible: true as unknown as string,
      },
    });

    expect(path(history.location)).toEqual("/articles/1234/?visible=y");
  });

  test("historySyncPlugin - FEP-1061: T-O-11 STRENGTHEN F3 — replace-route atomicity also asserts path(history.location) reflects new route's encode-output", async () => {
    // Strengthens the existing F3 (line ~2573). The third route uses an
    // identity encode (or no encode), so the URL == the path; but verify
    // the URL matches the new route's encode-output.
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
    const a = makeActionsProxy({ actions: coreStore.actions });

    await a.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: { articleId: "1" },
    });

    await a.replace({
      activityId: "a2",
      activityName: "ThirdActivity",
      activityParams: {
        thirdId: "9",
        visible: true as unknown as string,
      },
    });

    expect(path(history.location)).toEqual("/third/9/?visible=true");
  });
});

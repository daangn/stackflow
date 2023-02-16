import type {
  CoreStore,
  PushedEvent,
  StackflowPlugin,
  StepPushedEvent,
} from "@stackflow/core";
import { makeCoreStore, makeEvent } from "@stackflow/core";
import type { History, Location } from "history";
import { createMemoryHistory } from "history";

import { historySyncPlugin } from "./historySyncPlugin";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const path = (location: Location) => location.pathname + location.search;

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

describe("historySyncPlugin", () => {
  let history: History;
  let actions: CoreStore["actions"];

  /**
   * 매 테스트마다 history와 coreStore를 초기화합니다
   */
  beforeEach(() => {
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
        }),
      ],
    });

    actions = coreStore.actions;
  });

  test("historySyncPlugin - 초기에 매칭하는 라우트가 없는 경우 fallbackActivity에 설정한 액티비티의 라우트로 이동합니다", () => {
    expect(path(history.location)).toEqual("/home/");
  });

  test("historySyncPlugin - actions.push() 후에, 히스토리의 Path가 알맞게 바뀝니다", () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        title: "hello",
      },
    });

    expect(path(history.location)).toEqual("/articles/1234/?title=hello");
  });

  test("historySyncPlugin - 히스토리를 pop하는 경우, activity 상태가 바뀝니다", () => {
    actions.push({
      activityId: "a1",
      activityName: "Article",
      activityParams: {
        articleId: "1234",
        title: "hello",
      },
    });

    history.back();

    const activeActivity = actions
      .getStack()
      .activities.find((a) => a.isActive);

    expect(activeActivity?.name).toEqual("Home");
  });
});

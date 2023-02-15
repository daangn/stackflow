import { makeCoreStore, makeEvent } from "@stackflow/core";
import { createMemoryHistory } from "history";

import { historySyncPlugin } from "./historySyncPlugin";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;
const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

test("historySyncPlugin - 초기에 매칭하는 라우트가 없는 경우 fallbackActivity에 설정한 액티비티의 라우트로 이동합니다", () => {
  const history = createMemoryHistory();

  const plugin = historySyncPlugin({
    history,
    routes: {
      hello: "/hello",
      world: "/world",
    },
    fallbackActivity: () => "hello",
  });
  const pluginInstance = plugin();

  const coreStore = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 3000,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "world",
        eventDate: enoughPastTime(),
      }),
      ...(pluginInstance.overrideInitialEvents?.({
        initialContext: {},
        initialEvents: [],
      }) ?? []),
    ],
    plugins: [plugin],
  });

  coreStore.init();

  expect(history.location.pathname).toEqual("/hello");
});

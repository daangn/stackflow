import {makeCoreStore, makeEvent} from "@stackflow/core";
import {createMemoryHistory} from 'history';

import {historySyncPlugin} from "./historySyncPlugin";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;
const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

test("poc", () =>{
  const history = createMemoryHistory()
  const plugin = historySyncPlugin({history, routes: {hello: '/hello', world: '/world'}, fallbackActivity: () => 'hello' })
  const coreStore = makeCoreStore({
    initialEvents: [makeEvent("Initialized", {
      transitionDuration: 3000,
      eventDate: enoughPastTime(),
    }), makeEvent("ActivityRegistered", {
      activityName: "hello",
      eventDate: enoughPastTime(),
    }), makeEvent("ActivityRegistered", {
      activityName: "world",
      eventDate: enoughPastTime(),
    })],
    plugins: [plugin]
  });
  coreStore.init();
  expect(history.location.pathname).toEqual('/hello')
})

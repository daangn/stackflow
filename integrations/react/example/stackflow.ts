import { makeStackflow } from "../src";

export const { Stack, useFlow } = makeStackflow({
  transitionDuration: 300,
  activities: {
    hello: () => null,
  },
  initialActivity: () => "hello",
});

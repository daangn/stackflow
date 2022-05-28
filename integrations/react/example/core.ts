import { makeCore } from "../src";

export const { CoreProvider, useCore } = makeCore({ transitionDuration: 300 });

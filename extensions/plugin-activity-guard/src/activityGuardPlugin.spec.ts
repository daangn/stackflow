import { execFileSync } from "node:child_process";
import path from "node:path";
import { makeCoreStore, type StackflowPlugin } from "@stackflow/core";
import { redirect } from "./index";
import {
  activityNames,
  createStore,
  type GuardMap,
  push,
  pushed,
  replace,
  resetDeterministicEvents,
  snapshotActivityNames,
  snapshotEventSummary,
  snapshotProvider,
  staticEvents,
  stepPushed,
  topActivity,
} from "./test-utils";

const packageDirectory = path.resolve(__dirname, "..");

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(10_000);
  resetDeterministicEvents();
});

afterEach(() => {
  jest.restoreAllMocks();
});

function captureThrown(run: () => unknown) {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}

function observerPlugin(
  frames: Array<{ tag: string; names: string[] }>,
): StackflowPlugin {
  return () => ({
    key: `observer-${frames.length}`,
    onPushed: ({ actions, effect }) => {
      frames.push({
        tag: `${effect._TAG}:${effect.activity.name}`,
        names: actions.getStack().activities.map(({ name }) => name),
      });
    },
    onReplaced: ({ actions, effect }) => {
      frames.push({
        tag: `${effect._TAG}:${effect.activity.name}`,
        names: actions.getStack().activities.map(({ name }) => name),
      });
    },
  });
}

test("API-01 — package root exposes the documented CJS, ESM, and type symbols", () => {
  // Given a built package and external consumers, when each package-root fixture runs,
  // then all four values and both type-only imports resolve from the export map.
  for (const fixture of ["package-root.cjs", "package-root.mjs"]) {
    execFileSync(
      process.execPath,
      [path.join(packageDirectory, "test-consumers", fixture)],
      {
        cwd: packageDirectory,
        stdio: "pipe",
      },
    );
  }
  execFileSync(
    process.execPath,
    [path.join(packageDirectory, "scripts", "verify-package-root-types.mjs")],
    { cwd: packageDirectory, stdio: "pipe" },
  );
});

test("API-02 — redirect is inert until a Guard returns its resolution", () => {
  // Given an unchanged store, when a redirect resolution is only created,
  // then neither the stack nor its public event sequence changes.
  const store = makeCoreStore({
    initialEvents: [...staticEvents(), pushed("Home")],
    plugins: [],
  });
  const before = snapshotEventSummary(store);
  const resolution = redirect("Login", { returnTo: "a-1" });

  expect(snapshotEventSummary(store)).toEqual(before);

  // When the same resolution is returned by a Guard, only then is it applied.
  const guardedStore = createStore({
    guards: { ArticleEdit: () => resolution },
  });
  push(guardedStore, "ArticleEdit", { articleId: "a-1" });
  expect(activityNames(guardedStore)).toEqual(["Home", "Login"]);
});

test("GUARD-01 — true allows the original Entry with only activityName and params as input", () => {
  // Given an ArticleEdit Guard that records its public input,
  // when ArticleEdit is pushed, then it enters and no extra input fields exist.
  const inputs: unknown[] = [];
  const store = createStore({
    guards: {
      ArticleEdit: (input) => {
        inputs.push(input);
        return true;
      },
    },
  });

  push(store, "ArticleEdit", { articleId: "a-1" });

  expect(topActivity(store)).toMatchObject({
    name: "ArticleEdit",
    params: { articleId: "a-1" },
  });
  const expectedInput = {
    activityName: "ArticleEdit",
    params: { articleId: "a-1" },
  };
  expect(inputs).toEqual(expect.arrayContaining([expectedInput]));
  for (const input of inputs) {
    expect(input).toEqual(expectedInput);
    expect(Object.keys(input as object).sort()).toEqual([
      "activityName",
      "params",
    ]);
  }
});

test("GUARD-02 — an Activity without a registered Guard enters unchanged", () => {
  // Given only ArticleEdit is guarded, when Home is pushed,
  // then Home retains its params and push entry kind.
  const store = createStore({
    initialEvents: [pushed("Article", { articleId: "a-1" })],
    guards: { ArticleEdit: () => redirect("Login", { returnTo: "blocked" }) },
  });
  push(store, "Home", {});

  expect(topActivity(store)).toMatchObject({
    name: "Home",
    params: {},
    enteredBy: { name: "Pushed" },
  });
});

test("ENTRY-PUSH-REDIRECT — push Redirect atomically replaces the source target without a trace", () => {
  // Given Home and an ArticleEdit-to-Login Guard, when ArticleEdit is pushed,
  // then Login is the sole destination push and ArticleEdit never appears.
  const frames: Array<{ tag: string; names: string[] }> = [];
  const store = createStore({
    guards: {
      ArticleEdit: ({ params }) =>
        redirect("Login", { returnTo: params.articleId }),
    },
    pluginsAfter: [observerPlugin(frames)],
  });
  store.subscribe(() => {
    frames.push({ tag: "subscribe", names: activityNames(store) });
  });

  push(store, "ArticleEdit", { articleId: "a-1" });

  expect(topActivity(store)).toMatchObject({
    name: "Login",
    params: { returnTo: "a-1" },
    enteredBy: { name: "Pushed" },
  });
  expect(snapshotActivityNames(store)).toEqual(["Home", "Login"]);
  expect(frames.every(({ names }) => !names.includes("ArticleEdit"))).toBe(
    true,
  );
});

test("ENTRY-REPLACE-REDIRECT — replace Redirect preserves replace semantics without a source trace", () => {
  // Given active Home and an ArticleEdit-to-Login Guard, when replace is requested,
  // then Login is entered by Replaced and ArticleEdit never appears.
  const frames: Array<{ tag: string; names: string[] }> = [];
  const store = createStore({
    guards: { ArticleEdit: () => redirect("Login", { returnTo: "a-1" }) },
    pluginsAfter: [observerPlugin(frames)],
  });
  replace(store, "ArticleEdit", { articleId: "a-1" });

  expect(topActivity(store)).toMatchObject({
    name: "Login",
    enteredBy: { name: "Replaced" },
  });
  expect(store.actions.getStack().activities[0]).toMatchObject({
    name: "Home",
    exitedBy: { name: "Replaced" },
  });
  expect(snapshotActivityNames(store)).toEqual(["Home", "Login"]);
  expect(frames.every(({ names }) => !names.includes("ArticleEdit"))).toBe(
    true,
  );
});

test.each(["push", "replace"] as const)(
  "ENTRY-REDIRECT-OPTIONS — %s Redirect inherits its source transition choice",
  (kind) => {
    // Given an animate-false-equivalent request that Redirects, when it runs,
    // then the destination keeps the source event kind and settles immediately.
    const store = createStore({
      guards: { ArticleEdit: () => redirect("Login", { returnTo: kind }) },
    });
    const navigate = kind === "push" ? push : replace;
    navigate(
      store,
      "ArticleEdit",
      { articleId: "a-1" },
      { skipEnterActiveState: true },
    );

    expect(topActivity(store)).toMatchObject({
      name: "Login",
      transitionState: "enter-done",
      enteredBy: { name: kind === "push" ? "Pushed" : "Replaced" },
    });
    expect(store.actions.getStack().globalTransitionState).toBe("idle");
  },
);

test("ENTRY-REDIRECT-REGUARD — every Redirect destination is guarded again", () => {
  // Given ArticleEdit redirects to Login and Login redirects to Forbidden,
  // when ArticleEdit is pushed, then only guarded-and-allowed Forbidden enters.
  const store = createStore({
    guards: {
      ArticleEdit: () => redirect("Login", { returnTo: "a-1" }),
      Login: () => redirect("Forbidden", { reason: "signed-out" }),
      Forbidden: () => true,
    },
  });
  push(store, "ArticleEdit", { articleId: "a-1" });

  expect(activityNames(store)).toEqual(["Home", "Forbidden"]);
  expect(snapshotActivityNames(store)).toEqual(["Home", "Forbidden"]);
});

test("ENTRY-REDIRECT-TARGET-ERROR — a destination Guard rethrows the original error without partial Entry", () => {
  // Given a Redirect whose Login Guard throws a sentinel,
  // when ArticleEdit is pushed, then the exact error escapes and no target is recorded.
  const sentinel = new Error("destination guard failed");
  const store = createStore({
    guards: {
      ArticleEdit: () => redirect("Login", { returnTo: "a-1" }),
      Login: () => {
        throw sentinel;
      },
    },
  });
  const beforeStack = store.actions.getStack();
  const beforeEvents = snapshotEventSummary(store);

  const thrown = captureThrown(() =>
    push(store, "ArticleEdit", { articleId: "a-1" }),
  );

  expect(thrown).toBe(sentinel);
  expect(store.actions.getStack()).toEqual(beforeStack);
  expect(snapshotEventSummary(store)).toEqual(beforeEvents);
});

test.each(["push", "replace"] as const)(
  "ENTRY-ACTION-ERROR — %s Guard preserves the thrown object and event sequence",
  (kind) => {
    // Given a sentinel-throwing Guard and a snapshot, when the action runs,
    // then the same object is thrown and no stack or event mutation occurs.
    const sentinel = new Error(`${kind} guard failed`);
    const store = createStore({
      guards: {
        ArticleEdit: () => {
          throw sentinel;
        },
      },
    });
    const beforeStack = store.actions.getStack();
    const beforeEvents = snapshotEventSummary(store);
    const navigate = kind === "push" ? push : replace;

    expect(
      captureThrown(() => navigate(store, "ArticleEdit", { articleId: "a-1" })),
    ).toBe(sentinel);
    expect(store.actions.getStack()).toEqual(beforeStack);
    expect(snapshotEventSummary(store)).toEqual(beforeEvents);
  },
);

test.each(["push", "replace"] as const)(
  "ENTRY-ATOMIC-OBSERVATION — %s observers see one destination effect and no source frame",
  (kind) => {
    // Given observers before, after, and subscribed to core, when Redirect runs,
    // then every frame contains only the actual destination and source action kind.
    const beforeFrames: Array<{ tag: string; names: string[] }> = [];
    const afterFrames: Array<{ tag: string; names: string[] }> = [];
    const subscribeFrames: string[][] = [];
    const store = createStore({
      guards: { ArticleEdit: () => redirect("Login", { returnTo: kind }) },
      pluginsBefore: [observerPlugin(beforeFrames)],
      pluginsAfter: [observerPlugin(afterFrames)],
    });
    store.subscribe(() => subscribeFrames.push(activityNames(store)));
    const navigate = kind === "push" ? push : replace;
    navigate(store, "ArticleEdit", { articleId: "a-1" });

    const expectedTag = `${kind === "push" ? "PUSHED" : "REPLACED"}:Login`;
    expect(beforeFrames.map(({ tag }) => tag)).toEqual([expectedTag]);
    expect(afterFrames.map(({ tag }) => tag)).toEqual([expectedTag]);
    expect(
      [...beforeFrames, ...afterFrames].every(
        ({ names }) => !names.includes("ArticleEdit"),
      ),
    ).toBe(true);
    expect(
      subscribeFrames.every((names) => !names.includes("ArticleEdit")),
    ).toBe(true);
  },
);

test("ENTRY-DEEP-LINK-INITIAL — a deep-link producer feeds parsed params into the initial Guard", () => {
  // Given a source plugin that maps initialContext.req.path to ArticleEdit,
  // when the store is created, then the parsed params reach the Guard and only Login remains.
  const inputs: unknown[] = [];
  const deepLinkProducer: StackflowPlugin = () => ({
    key: "deep-link-producer",
    overrideInitialEvents: ({ initialContext, initInfo }) => {
      if (initInfo.kind !== "create") return [];
      const articleId = String(initialContext.req.path).split("/")[2];
      return [
        pushed("ArticleEdit", { articleId }, { activityId: "activity-0001" }),
      ];
    },
  });
  const store = createStore({
    initialEvents: [],
    initialContext: { req: { path: "/articles/a-1/edit" } },
    pluginsBefore: [deepLinkProducer],
    guards: {
      ArticleEdit: (input) => {
        inputs.push(input);
        return redirect("Login", { returnTo: input.params.articleId });
      },
    },
  });

  const expectedInput = {
    activityName: "ArticleEdit",
    params: { articleId: "a-1" },
  };
  expect(inputs).toEqual(expect.arrayContaining([expectedInput]));
  for (const input of inputs) expect(input).toEqual(expectedInput);
  expect(activityNames(store)).toEqual(["Login"]);
  expect(snapshotActivityNames(store)).toEqual(["Login"]);
});

test.each(["default", "deep-link"] as const)(
  "ENTRY-INITIAL-ERROR — %s Guard failure aborts creation with the original error",
  (source) => {
    // Given an initial source whose Guard throws, when creation is attempted,
    // then the exact sentinel escapes and no store is returned.
    const sentinel = new Error(`${source} initial guard failed`);
    let created: ReturnType<typeof createStore> | undefined;
    const sourcePlugin: StackflowPlugin = () => ({
      key: "conditional-initial-source",
      overrideInitialEvents: ({ initInfo }) =>
        initInfo.kind === "create"
          ? [pushed("ArticleEdit", { articleId: "a-1" })]
          : [],
    });
    const thrown = captureThrown(() => {
      created = createStore({
        initialEvents:
          source === "default"
            ? [pushed("ArticleEdit", { articleId: "a-1" })]
            : [],
        pluginsBefore: source === "deep-link" ? [sourcePlugin] : [],
        guards: {
          ArticleEdit: () => {
            throw sentinel;
          },
        },
      });
    });

    expect(thrown).toBe(sentinel);
    expect(created).toBeUndefined();
  },
);

test("ENTRY-INITIAL-STEPS-ALLOW — allowed initial explicit steps preserve order, ids, and params", () => {
  // Given Article plus two explicit initial steps and an allowing Guard,
  // when the store is created, then entry/s1/s2 and both StepPushed events remain.
  const guardInputs: unknown[] = [];
  const store = createStore({
    initialEvents: [
      pushed("Article", { articleId: "a-1" }, { activityId: "activity-0001" }),
      stepPushed("s1", { articleId: "a-2" }, "activity-0001"),
      stepPushed("s2", { articleId: "a-3" }, "activity-0001"),
    ],
    guards: {
      Article: (input) => {
        guardInputs.push(input);
        return true;
      },
    },
  });

  const expectedInput = {
    activityName: "Article",
    params: { articleId: "a-1" },
  };
  expect(guardInputs).toEqual(expect.arrayContaining([expectedInput]));
  for (const input of guardInputs) expect(input).toEqual(expectedInput);
  expect(
    topActivity(store)?.steps.map(({ id, params }) => ({ id, params })),
  ).toEqual([
    { id: "activity-0001", params: { articleId: "a-1" } },
    { id: "s1", params: { articleId: "a-2" } },
    { id: "s2", params: { articleId: "a-3" } },
  ]);
  expect(
    store.actions
      .captureSnapshot()
      .events.filter(({ name }) => name === "StepPushed"),
  ).toHaveLength(2);
});

test("ENTRY-INITIAL-STEPS-REDIRECT — redirected initial source steps are removed instead of leaking", () => {
  // Given ArticleEdit and its explicit step Redirect to Login,
  // when the store is created, then Login has only its implicit entry step.
  const frames: string[][] = [];
  const eventObserver: StackflowPlugin = () => ({
    key: "initial-event-observer",
    overrideInitialEvents: ({ initialEvents }) => {
      frames.push(
        initialEvents.flatMap((entry) =>
          entry.name === "Pushed" || entry.name === "Replaced"
            ? [entry.activityName]
            : [],
        ),
      );
      return initialEvents;
    },
  });
  const store = createStore({
    initialEvents: [
      pushed(
        "ArticleEdit",
        { articleId: "a-1" },
        { activityId: "activity-0001" },
      ),
      stepPushed("edit-step", { articleId: "a-2" }, "activity-0001"),
    ],
    guards: { ArticleEdit: () => redirect("Login", { returnTo: "a-1" }) },
    pluginsAfter: [eventObserver],
  });

  expect(activityNames(store)).toEqual(["Login"]);
  expect(topActivity(store)?.steps).toHaveLength(1);
  expect(topActivity(store)?.steps[0]).toMatchObject({
    params: { returnTo: "a-1" },
  });
  expect(
    store.actions
      .captureSnapshot()
      .events.some(({ name }) => name === "StepPushed"),
  ).toBe(false);
  expect(frames.every((names) => !names.includes("ArticleEdit"))).toBe(true);
});

test.each([0, 1, 2])(
  "ENTRY-MULTI-FRESH-EACH — bundled fresh Entry at index %i receives its own name and params",
  (targetIndex) => {
    // Given three bundled fresh Entries and a pairing-sensitive target Guard,
    // when creation evaluates every position, then the sentinel proves the matching pair was visited.
    const entries = [
      ["Home", {}],
      ["Article", { articleId: "article-1" }],
      ["ArticleEdit", { articleId: "edit-1" }],
    ] as const;
    const [targetName, targetParams] = entries[targetIndex];
    const sentinel = new Error(`fresh index ${targetIndex}`);
    const guards = {
      [targetName]: (input: {
        activityName: string;
        params: Record<string, string>;
      }) => {
        if (
          input.activityName === targetName &&
          JSON.stringify(input.params) === JSON.stringify(targetParams)
        ) {
          throw sentinel;
        }
        return true as const;
      },
    };

    expect(
      captureThrown(() =>
        createStore({
          guards,
          initialEvents: entries.map(([name, params], index) =>
            pushed(name, params, {
              activityId: `activity-${String(index + 1).padStart(4, "0")}`,
              skipEnterActiveState: true,
            }),
          ),
        }),
      ),
    ).toBe(sentinel);
  },
);

test.each([
  { caseName: "all Entries allowed", targetIndex: null },
  { caseName: "target index 0", targetIndex: 0 },
  { caseName: "target index 1", targetIndex: 1 },
  { caseName: "target index 2", targetIndex: 2 },
] as const)(
  "ENTRY-SEQUENTIAL-EACH — $caseName receives its own name and params",
  ({ targetIndex }) => {
    // Given one fresh and two planned pushes with pairing-sensitive guards,
    // when the producer advances, then an all-allow plan completes and each target row throws its sentinel.
    const plan = [
      ["Home", {}],
      ["Article", { articleId: "article-1" }],
      ["ArticleEdit", { articleId: "edit-1" }],
    ] as const;
    const observedInputs: unknown[] = [];
    const allowGuards: GuardMap = {
      Home: (input) => {
        observedInputs.push(input);
        return true;
      },
      Article: (input) => {
        observedInputs.push(input);
        return true;
      },
      ArticleEdit: (input) => {
        observedInputs.push(input);
        return true;
      },
    };

    if (targetIndex === null) {
      const store = createStore({
        guards: allowGuards,
        initialEvents: [pushed("Home")],
      });
      push(store, "Article", { articleId: "article-1" });
      push(store, "ArticleEdit", { articleId: "edit-1" });

      expect(
        store.actions.getStack().activities.map(({ name, params }) => ({
          name,
          params,
        })),
      ).toEqual(
        plan.map(([name, params]) => ({
          name,
          params,
        })),
      );
      expect(observedInputs).toEqual(
        expect.arrayContaining(
          plan.map(([activityName, params]) => ({ activityName, params })),
        ),
      );
      return;
    }

    const sentinel = new Error(`sequential index ${targetIndex}`);
    const [targetName, targetParams] = plan[targetIndex];
    const guards = {
      [targetName]: (input: {
        activityName: string;
        params: Record<string, string>;
      }) => {
        if (
          input.activityName === targetName &&
          JSON.stringify(input.params) === JSON.stringify(targetParams)
        ) {
          throw sentinel;
        }
        return true as const;
      },
    };
    let store: ReturnType<typeof createStore> | undefined;
    const thrown = captureThrown(() => {
      store = createStore({ guards, initialEvents: [pushed("Home")] });
      push(store, "Article", { articleId: "article-1" });
      push(store, "ArticleEdit", { articleId: "edit-1" });
    });

    expect(thrown).toBe(sentinel);
    if (store) {
      expect(activityNames(store)).toEqual(
        plan.slice(0, targetIndex).map(([name]) => name),
      );
    }
  },
);

test("ENTRY-SEQUENTIAL-CANCEL — a middle Redirect cancels only the pending tail of its initial plan", () => {
  // Given [Home, Article, ArticleEdit->Login, Audit, Forbidden] in one plan,
  // when the producer observes target replacement, then it stops before dispatching the tail.
  const frames: Array<{ tag: string; names: string[] }> = [];
  const store = createStore({
    guards: {
      ArticleEdit: () => redirect("Login", { returnTo: "edit-1" }),
    },
    pluginsAfter: [observerPlugin(frames)],
  });
  const plan = [
    ["Article", { articleId: "article-1" }],
    ["ArticleEdit", { articleId: "edit-1" }],
    ["Audit", { source: "plan-tail" }],
    ["Forbidden", { reason: "plan-tail" }],
  ] as const;

  for (const [name, params] of plan) {
    push(store, name, params);
    if (topActivity(store)?.name !== name) break;
  }

  expect(activityNames(store)).toEqual(["Home", "Article", "Login"]);
  expect(snapshotActivityNames(store)).toEqual(["Home", "Article", "Login"]);
  expect(
    frames.every(({ names }) =>
      ["ArticleEdit", "Audit", "Forbidden"].every(
        (name) => !names.includes(name),
      ),
    ),
  ).toBe(true);
});

test("ENTRY-CANCEL-SCOPE — cancelling an initial plan does not swallow a later user navigation", () => {
  // Given a prior plan stopped by Redirect, when a distinct Audit push follows,
  // then its Guard applies and Audit enters normally.
  const auditInputs: unknown[] = [];
  const store = createStore({
    guards: {
      ArticleEdit: () => redirect("Login", { returnTo: "edit-1" }),
      Audit: (input) => {
        auditInputs.push(input);
        return true;
      },
    },
  });
  push(store, "ArticleEdit", { articleId: "edit-1" });
  push(store, "Audit", { source: "user" });

  expect(topActivity(store)).toMatchObject({
    name: "Audit",
    params: { source: "user" },
  });
  const expectedInput = {
    activityName: "Audit",
    params: { source: "user" },
  };
  expect(auditInputs).toEqual(expect.arrayContaining([expectedInput]));
  for (const input of auditInputs) expect(input).toEqual(expectedInput);
});

test("NONENTRY-REACTIVATION — pop does not guard either the exiting or reactivated Activity", () => {
  // Given Article and Home entered while allowed, then both Guards become throwing,
  // when Home pops, then the same Article instance reactivates without either error.
  let throwOnEvaluation = false;
  const articleError = new Error("reactivated Article was guarded");
  const homeError = new Error("exiting Home was guarded");
  const store = createStore({
    initialEvents: [
      pushed("Article", { articleId: "a-1" }, { activityId: "activity-0001" }),
    ],
    guards: {
      Article: () => {
        if (throwOnEvaluation) throw articleError;
        return true;
      },
      Home: () => {
        if (throwOnEvaluation) throw homeError;
        return true;
      },
    },
  });
  push(store, "Home");
  throwOnEvaluation = true;

  expect(
    captureThrown(() => store.actions.pop({ skipExitActiveState: true })),
  ).toBeUndefined();
  expect(topActivity(store)).toMatchObject({
    id: "activity-0001",
    name: "Article",
    isActive: true,
  });
  expect(snapshotActivityNames(store)).toEqual(["Article", "Home"]);
});

test("NONENTRY-LOAD — snapshot replay restores a guarded Activity without evaluating its Guard", () => {
  // Given a public snapshot with ArticleEdit and a now-throwing Guard,
  // when a provider loads it, then the original id, params, and history are restored.
  const original = makeCoreStore({
    initialEvents: [
      ...staticEvents(),
      pushed("Home", {}, { activityId: "activity-0001" }),
      pushed(
        "ArticleEdit",
        { articleId: "a-1" },
        { activityId: "activity-0002" },
      ),
    ],
    plugins: [],
  });
  const snapshot = original.actions.captureSnapshot();
  const sentinel = new Error("load must not evaluate Guard");
  const store = createStore({
    guards: {
      ArticleEdit: () => {
        throw sentinel;
      },
    },
    pluginsBefore: [snapshotProvider(snapshot)],
  });

  expect(activityNames(store)).toEqual(["Home", "ArticleEdit"]);
  expect(topActivity(store)).toMatchObject({
    id: "activity-0002",
    params: { articleId: "a-1" },
  });
  expect(snapshotEventSummary(store)).toEqual(
    snapshot.events.map((entry) => ({
      id: entry.id,
      name: entry.name,
      activityName:
        entry.name === "Pushed" || entry.name === "Replaced"
          ? entry.activityName
          : undefined,
    })),
  );
});

test("ENTRY-AFTER-LOAD — a new Entry after snapshot load is guarded normally", () => {
  // Given a loaded Home stack and ArticleEdit-to-Login Guard,
  // when ArticleEdit is newly pushed, then Login replaces only that new target.
  const original = makeCoreStore({
    initialEvents: [
      ...staticEvents(),
      pushed("Home", {}, { activityId: "activity-0001" }),
    ],
    plugins: [],
  });
  const frames: Array<{ tag: string; names: string[] }> = [];
  const store = createStore({
    guards: { ArticleEdit: () => redirect("Login", { returnTo: "a-1" }) },
    pluginsBefore: [snapshotProvider(original.actions.captureSnapshot())],
    pluginsAfter: [observerPlugin(frames)],
  });
  push(store, "ArticleEdit", { articleId: "a-1" });

  expect(activityNames(store)).toEqual(["Home", "Login"]);
  expect(snapshotActivityNames(store)).toEqual(["Home", "Login"]);
  expect(frames.every(({ names }) => !names.includes("ArticleEdit"))).toBe(
    true,
  );
});

test("NONENTRY-STEPS — step push, replace, and pop never evaluate an Activity Guard", () => {
  // Given an entered Article whose Guard later throws and a valid step,
  // when all three step operations run, then the Activity id survives and no Activity Entry occurs.
  let throwOnEvaluation = false;
  const sentinel = new Error("step operation evaluated Activity Guard");
  const store = createStore({
    initialEvents: [
      pushed("Article", { articleId: "a-1" }, { activityId: "activity-0001" }),
    ],
    guards: {
      Article: () => {
        if (throwOnEvaluation) throw sentinel;
        return true;
      },
    },
  });
  throwOnEvaluation = true;

  const thrown = captureThrown(() => {
    store.actions.stepPush({
      stepId: "step-1",
      stepParams: { articleId: "a-2" },
    });
    store.actions.stepReplace({
      stepId: "step-2",
      stepParams: { articleId: "a-3" },
    });
    store.actions.stepPop({});
  });

  expect(thrown).toBeUndefined();
  expect(topActivity(store)).toMatchObject({
    id: "activity-0001",
    name: "Article",
  });
  expect(activityNames(store)).toEqual(["Article"]);
  expect(
    store.actions.captureSnapshot().events.map(({ name }) => name),
  ).toEqual(["Pushed", "StepPushed", "StepReplaced", "StepPopped"]);
});

import { and, or, redirect } from "./index";
import {
  activityNames,
  createStore,
  push,
  resetDeterministicEvents,
  snapshotActivityNames,
  topActivity,
} from "./test-utils";

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

test("AND-ALL-TRUE — AND evaluates every true child in declaration order before allowing Entry", () => {
  // Given three distinguishable true Guards, when the composite guards ArticleEdit,
  // then every marker participates in declaration order and ArticleEdit enters.
  const trace: string[] = [];
  const composite = and({
    guards: [
      () => {
        trace.push("first");
        return true;
      },
      () => {
        trace.push("second");
        return true;
      },
      () => {
        trace.push("third");
        return true;
      },
    ],
  });
  const store = createStore({ guards: { ArticleEdit: composite } });
  push(store, "ArticleEdit", { articleId: "a-1" });

  expect(trace).toEqual(expect.arrayContaining(["first", "second", "third"]));
  expect(trace.indexOf("first")).toBeLessThan(trace.indexOf("second"));
  expect(trace.indexOf("second")).toBeLessThan(trace.indexOf("third"));
  expect(topActivity(store)?.name).toBe("ArticleEdit");
});

test("AND-FIRST-RESOLUTION — AND adopts the first resolution and excludes later children", () => {
  // Given [true, Login resolution, throwing child], when the composite runs,
  // then Login enters after ordered prefix evaluation and the last child is absent.
  const trace: string[] = [];
  const composite = and({
    guards: [
      () => {
        trace.push("allow");
        return true;
      },
      () => {
        trace.push("redirect");
        return redirect("Login", { returnTo: "a-1" });
      },
      () => {
        trace.push("would-throw");
        throw new Error("AND did not short-circuit");
      },
    ],
  });
  const store = createStore({ guards: { ArticleEdit: composite } });
  push(store, "ArticleEdit", { articleId: "a-1" });

  expect(trace).toEqual(expect.arrayContaining(["allow", "redirect"]));
  expect(trace.indexOf("allow")).toBeLessThan(trace.indexOf("redirect"));
  expect(trace).not.toContain("would-throw");
  expect(activityNames(store)).toEqual(["Home", "Login"]);
});

test("OR-FIRST-TRUE — OR allows at the first true and excludes later children and otherwise", () => {
  // Given [resolution, true, throwing child] and throwing otherwise,
  // when OR runs, then the original Entry is allowed at the true child.
  const trace: string[] = [];
  const composite = or({
    guards: [
      (_input: {
        activityName: "ArticleEdit";
        params: { articleId: string };
      }) => {
        trace.push("resolution");
        return redirect("Login", { returnTo: "a-1" });
      },
      () => {
        trace.push("allow");
        return true;
      },
      () => {
        trace.push("would-throw");
        throw new Error("OR did not short-circuit");
      },
    ],
    otherwise: () => {
      trace.push("otherwise");
      throw new Error("OR evaluated otherwise after true");
    },
  });
  const store = createStore({ guards: { ArticleEdit: composite } });
  push(store, "ArticleEdit", { articleId: "a-1" });

  expect(trace).toEqual(expect.arrayContaining(["resolution", "allow"]));
  expect(trace.indexOf("resolution")).toBeLessThan(trace.indexOf("allow"));
  expect(trace).not.toContain("would-throw");
  expect(trace).not.toContain("otherwise");
  expect(topActivity(store)?.name).toBe("ArticleEdit");
});

test("OR-OTHERWISE — OR discards child resolutions and applies otherwise with the original input", () => {
  // Given two child resolutions and an Audit otherwise, when all children resolve,
  // then otherwise receives the original input and only Audit enters.
  const trace: string[] = [];
  const otherwiseInputs: unknown[] = [];
  const composite = or({
    guards: [
      (_input: {
        activityName: "ArticleEdit";
        params: { articleId: string };
      }) => {
        trace.push("login");
        return redirect("Login", { returnTo: "a-1" });
      },
      () => {
        trace.push("forbidden");
        return redirect("Forbidden", { reason: "not-editor" });
      },
    ],
    otherwise: (input) => {
      trace.push("otherwise");
      otherwiseInputs.push(input);
      return redirect("Audit", { source: input.params.articleId });
    },
  });
  const store = createStore({ guards: { ArticleEdit: composite } });
  push(store, "ArticleEdit", { articleId: "a-1" });

  expect(trace).toEqual(
    expect.arrayContaining(["login", "forbidden", "otherwise"]),
  );
  expect(trace.indexOf("login")).toBeLessThan(trace.indexOf("forbidden"));
  expect(trace.indexOf("forbidden")).toBeLessThan(trace.indexOf("otherwise"));
  const expectedInput = {
    activityName: "ArticleEdit",
    params: { articleId: "a-1" },
  };
  expect(otherwiseInputs).toEqual(expect.arrayContaining([expectedInput]));
  for (const input of otherwiseInputs) expect(input).toEqual(expectedInput);
  expect(activityNames(store)).toEqual(["Home", "Audit"]);
  expect(snapshotActivityNames(store)).toEqual(["Home", "Audit"]);
});

test.each(["and-child", "or-child", "or-otherwise"] as const)(
  "COMBINATOR-ERROR — %s throws the identical error and stops later work",
  (location) => {
    // Given a sentinel at one composite evaluation position, when Entry is requested,
    // then the same object escapes and neither later children nor dispatch occur.
    const sentinel = new Error(`${location} failed`);
    const trace: string[] = [];
    const throwing = () => {
      trace.push("throwing");
      throw sentinel;
    };
    const wouldRun = () => {
      trace.push("would-run");
      return true as const;
    };
    const composite =
      location === "and-child"
        ? and({ guards: [throwing, wouldRun] })
        : or({
            guards:
              location === "or-child"
                ? [throwing, wouldRun]
                : [() => redirect("Login", { returnTo: "a-1" })],
            otherwise:
              location === "or-otherwise"
                ? throwing
                : () => redirect("Audit", { source: "fallback" }),
          });
    const store = createStore({ guards: { ArticleEdit: composite } });
    const before = store.actions.captureSnapshot();

    expect(
      captureThrown(() => push(store, "ArticleEdit", { articleId: "a-1" })),
    ).toBe(sentinel);
    expect(trace).not.toContain("would-run");
    expect(store.actions.captureSnapshot()).toEqual(before);
  },
);

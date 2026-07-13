import { defineConfig } from "@stackflow/config";
import type { Stack, StackflowPlugin, StackSnapshot } from "@stackflow/core";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import {
  type ActivityComponentType,
  type StackflowReactPlugin,
  stackflow,
  useLoaderData,
} from "@stackflow/react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { activityGuardPlugin, redirect } from "./index";
import { pushed, resetDeterministicEvents, stepPushed } from "./test-utils";

declare module "@stackflow/config" {
  interface Register {
    Home: {};
    Article: { articleId: string };
    ArticleEdit: { articleId: string };
    Login: { returnTo: string };
    Forbidden: { reason: string };
    Audit: { source: string };
  }
}

const HomeComponent: ActivityComponentType<"Home"> = () => (
  <div data-testid="Home">HOME_MARKER</div>
);

const ArticleComponent: ActivityComponentType<"Article"> = ({ params }) => (
  <div data-testid="Article">ARTICLE_MARKER:{params.articleId}</div>
);

const ArticleEditComponent: ActivityComponentType<"ArticleEdit"> = ({
  params,
}) => (
  <div data-testid="ArticleEdit">ARTICLE_EDIT_MARKER:{params.articleId}</div>
);

const LoginComponent: ActivityComponentType<"Login"> = ({ params }) => (
  <div data-testid="Login">LOGIN_MARKER:{params.returnTo}</div>
);

const ForbiddenComponent: ActivityComponentType<"Forbidden"> = ({ params }) => (
  <div data-testid="Forbidden">FORBIDDEN_MARKER:{params.reason}</div>
);

const AuditComponent: ActivityComponentType<"Audit"> = ({ params }) => (
  <div data-testid="Audit">AUDIT_MARKER:{params.source}</div>
);

const loginLoader = ({ params }: { params: { returnTo: string } }) => ({
  label: `LOGIN_LOADER:${params.returnTo}`,
});

const LoginWithLoaderComponent: ActivityComponentType<"Login"> = ({
  params,
}) => {
  const data = useLoaderData<typeof loginLoader>();
  return (
    <div data-testid="Login">
      LOGIN_MARKER:{params.returnTo}:{data.label}
    </div>
  );
};

const components = {
  Home: HomeComponent,
  Article: ArticleComponent,
  ArticleEdit: ArticleEditComponent,
  Login: LoginComponent,
  Forbidden: ForbiddenComponent,
  Audit: AuditComponent,
};

beforeEach(() => {
  jest.useFakeTimers({ now: 10_000 });
  resetDeterministicEvents();
});

afterEach(() => {
  cleanup();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

function observeContainer(container: HTMLElement) {
  const committedText: string[] = [];
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        committedText.push(node.textContent ?? "");
      }
    }
  });
  observer.observe(container, { childList: true, subtree: true });
  return { committedText, observer };
}

test("ENTRY-DEFAULT-INITIAL — initialActivity is guarded before the first committed Activity", async () => {
  // Given default Home and a Home-to-Login Guard, when Stack first renders,
  // then the first committed Activity is a Pushed Login and Home never commits.
  const initialEventsSeen: Array<{ name: string; activityName?: string }> = [];
  const observerPlugin: StackflowPlugin = () => ({
    key: "default-initial-observer",
    overrideInitialEvents: ({ initialEvents }) => {
      initialEventsSeen.push(
        ...initialEvents.map((entry) => ({
          name: entry.name,
          activityName:
            entry.name === "Pushed" || entry.name === "Replaced"
              ? entry.activityName
              : undefined,
        })),
      );
      return initialEvents;
    },
  });
  const config = defineConfig({
    activities: [
      { name: "Home" },
      { name: "Article" },
      { name: "ArticleEdit" },
      { name: "Login" },
      { name: "Forbidden" },
      { name: "Audit" },
    ],
    transitionDuration: 0,
    initialActivity: () => "Home",
  });
  const { Stack } = stackflow({
    config,
    components,
    plugins: [
      basicRendererPlugin(),
      activityGuardPlugin({
        guards: { Home: () => redirect("Login", { returnTo: "default" }) },
      }),
      observerPlugin,
    ],
  });
  const container = document.createElement("div");
  document.body.append(container);
  const { committedText, observer } = observeContainer(container);

  await act(async () => {
    render(<Stack />, { container });
    await Promise.resolve();
  });
  observer.disconnect();

  expect(screen.getByTestId("Login").textContent).toBe("LOGIN_MARKER:default");
  expect(screen.queryByTestId("Home")).toBeNull();
  expect(initialEventsSeen).toEqual([
    { name: "Pushed", activityName: "Login" },
  ]);
  expect(committedText.every((text) => !text.includes("HOME_MARKER"))).toBe(
    true,
  );
});

test.each([0, 1, 2])(
  "ENTRY-MULTI-FRESH-CANCEL — bundled Redirect at index %i preserves prefix and removes source and tail Activities, steps, and DOM",
  async (targetIndex) => {
    // Given three fresh Entries each with an explicit step and one Redirect position,
    // when the initial bundle renders, then prefix survives, Login substitutes target, and tail is absent everywhere.
    const entries = [
      {
        name: "Home",
        params: {},
        id: "activity-0001",
        stepId: "home-step",
      },
      {
        name: "Article",
        params: { articleId: "article-1" },
        id: "activity-0002",
        stepId: "article-step",
      },
      {
        name: "ArticleEdit",
        params: { articleId: "edit-1" },
        id: "activity-0003",
        stepId: "edit-step",
      },
    ] as const;
    let capturedStack: Stack | undefined;
    let capturedSnapshot: StackSnapshot | undefined;
    const initialFrames: string[][] = [];
    const sourcePlugin: StackflowPlugin = () => ({
      key: "bundled-initial-source",
      overrideInitialEvents: ({ initInfo }) =>
        initInfo.kind === "create"
          ? entries.flatMap((entry) => [
              pushed(entry.name, entry.params, {
                activityId: entry.id,
                skipEnterActiveState: true,
              }),
              stepPushed(entry.stepId, { source: entry.stepId }, entry.id),
            ])
          : [],
    });
    const publicObserver: StackflowPlugin = () => ({
      key: "bundled-public-observer",
      overrideInitialEvents: ({ initialEvents }) => {
        initialFrames.push(
          initialEvents.flatMap((entry) =>
            entry.name === "Pushed" || entry.name === "Replaced"
              ? [entry.activityName]
              : [],
          ),
        );
        return initialEvents;
      },
      onInit: ({ actions }) => {
        capturedStack = actions.getStack();
        capturedSnapshot = actions.captureSnapshot();
      },
    });
    const target = entries[targetIndex];
    const config = defineConfig({
      activities: [
        { name: "Home" },
        { name: "Article" },
        { name: "ArticleEdit" },
        { name: "Login" },
        { name: "Forbidden" },
        { name: "Audit" },
      ],
      transitionDuration: 0,
    });
    const { Stack } = stackflow({
      config,
      components,
      plugins: [
        basicRendererPlugin(),
        sourcePlugin,
        activityGuardPlugin({
          guards: {
            [target.name]: () => redirect("Login", { returnTo: target.name }),
          },
        }),
        publicObserver,
      ],
    });
    const container = document.createElement("div");
    document.body.append(container);
    const { committedText, observer } = observeContainer(container);

    await act(async () => {
      render(<Stack />, { container });
      await Promise.resolve();
    });
    observer.disconnect();

    const expectedNames = [
      ...entries.slice(0, targetIndex).map(({ name }) => name),
      "Login",
    ];
    const removed = entries.slice(targetIndex).map(({ name }) => name);
    const markers = {
      Home: "HOME_MARKER",
      Article: "ARTICLE_MARKER",
      ArticleEdit: "ARTICLE_EDIT_MARKER",
    } as const;
    expect(capturedStack?.activities.map(({ name }) => name)).toEqual(
      expectedNames,
    );
    expect(initialFrames).toEqual([expectedNames]);
    expect(
      capturedSnapshot?.events.flatMap((entry) =>
        entry.name === "Pushed" || entry.name === "Replaced"
          ? [entry.activityName]
          : [],
      ),
    ).toEqual(expectedNames);
    expect(
      capturedSnapshot?.events.flatMap((entry) =>
        entry.name === "StepPushed"
          ? [{ stepId: entry.stepId, params: entry.stepParams }]
          : [],
      ),
    ).toEqual(
      entries.slice(0, targetIndex).map((entry) => ({
        stepId: entry.stepId,
        params: { source: entry.stepId },
      })),
    );
    expect(
      capturedStack?.activities
        .slice(0, targetIndex)
        .every((activity, index) =>
          activity.steps.map(({ id }) => id).includes(entries[index].stepId),
        ),
    ).toBe(true);
    expect(capturedStack?.activities.at(-1)?.steps).toHaveLength(1);
    expect(removed.every((name) => !initialFrames.flat().includes(name))).toBe(
      true,
    );
    expect(removed.every((name) => screen.queryByTestId(name) === null)).toBe(
      true,
    );
    expect(
      committedText.every((text) =>
        removed.every((name) => !text.includes(markers[name])),
      ),
    ).toBe(true);
  },
);

test("ECO-LOADER-RENDER — Redirect renders destination loader data through renderer and basic UI without source flash", async () => {
  // Given loader-backed ArticleEdit/Login components and renderer/basic UI,
  // when ArticleEdit Redirects, then Login data renders, transitions settle, and ArticleEdit never commits.
  let settledStack: Stack | undefined;
  const stackObserver: StackflowPlugin = () => ({
    key: "loader-render-observer",
    onChanged: ({ actions }) => {
      settledStack = actions.getStack();
    },
  });
  const config = defineConfig({
    activities: [
      { name: "Home" },
      { name: "Article" },
      {
        name: "ArticleEdit",
        loader: ({ params }) => ({ label: `EDIT_LOADER:${params.articleId}` }),
      },
      { name: "Login", loader: loginLoader },
      { name: "Forbidden" },
      { name: "Audit" },
    ],
    transitionDuration: 0,
    initialActivity: () => "Home",
  });
  const { Stack, actions } = stackflow({
    config,
    components: { ...components, Login: LoginWithLoaderComponent },
    plugins: [
      basicRendererPlugin(),
      basicUIPlugin({ theme: "cupertino" }),
      activityGuardPlugin({
        guards: {
          ArticleEdit: ({ params }) =>
            redirect("Login", { returnTo: params.articleId }),
        },
      }),
      stackObserver,
    ],
  });
  const container = document.createElement("div");
  document.body.append(container);
  render(<Stack />, { container });
  const { committedText, observer } = observeContainer(container);

  await act(async () => {
    actions.push("ArticleEdit", { articleId: "a-1" }, { animate: false });
    jest.runOnlyPendingTimers();
    await Promise.resolve();
  });
  observer.disconnect();

  expect(screen.getByTestId("Login").textContent).toBe(
    "LOGIN_MARKER:a-1:LOGIN_LOADER:a-1",
  );
  expect(screen.queryByTestId("ArticleEdit")).toBeNull();
  expect(
    committedText.every((text) => !text.includes("ARTICLE_EDIT_MARKER")),
  ).toBe(true);
  expect(settledStack).toMatchObject({ globalTransitionState: "idle" });
  expect(settledStack?.activities.at(-1)).toMatchObject({
    name: "Login",
    isTop: true,
    isActive: true,
  });
});

test("ECO-POST-EFFECT — plugins on both sides observe only destination push/replace effects and settled transitions", async () => {
  // Given observer plugins before and after the Guard, when Redirected push and replace run,
  // then both observe the actual destination, source action kind, and settled active top.
  for (const kind of ["push", "replace"] as const) {
    const before: Array<{ tag: string; name: string; stack: Stack }> = [];
    const after: Array<{ tag: string; name: string; stack: Stack }> = [];
    const makeObserver =
      (
        key: string,
        records: Array<{ tag: string; name: string; stack: Stack }>,
      ): StackflowReactPlugin =>
      () => ({
        key,
        onPushed: ({ actions, effect }) => {
          records.push({
            tag: effect._TAG,
            name: effect.activity.name,
            stack: actions.getStack(),
          });
        },
        onReplaced: ({ actions, effect }) => {
          records.push({
            tag: effect._TAG,
            name: effect.activity.name,
            stack: actions.getStack(),
          });
        },
      });
    const config = defineConfig({
      activities: [
        { name: "Home" },
        { name: "Article" },
        { name: "ArticleEdit" },
        { name: "Login" },
        { name: "Forbidden" },
        { name: "Audit" },
      ],
      transitionDuration: 0,
      initialActivity: () => "Home",
    });
    const beforePlugin = makeObserver(`before-${kind}`, before);
    const afterPlugin = makeObserver(`after-${kind}`, after);
    const { Stack, actions } = stackflow({
      config,
      components,
      plugins: [
        basicRendererPlugin(),
        beforePlugin,
        activityGuardPlugin({
          guards: {
            ArticleEdit: () => redirect("Login", { returnTo: kind }),
          },
        }),
        afterPlugin,
      ],
    });
    const rendered = render(<Stack />);

    await act(async () => {
      actions[kind]("ArticleEdit", { articleId: "a-1" }, { animate: false });
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    const expectedTag = kind === "push" ? "PUSHED" : "REPLACED";
    for (const records of [before, after]) {
      expect(records.map(({ tag, name }) => ({ tag, name }))).toEqual([
        { tag: expectedTag, name: "Login" },
      ]);
      expect(records[0].stack.globalTransitionState).toBe("idle");
      expect(records[0].stack.activities.at(-1)).toMatchObject({
        name: "Login",
        isTop: true,
        isActive: true,
      });
    }
    rendered.unmount();
  }
});

import type {
  ActivityDefinition,
  RegisteredActivityName,
} from "@stackflow/config";
import {
  type ActivityGuard,
  activityGuardPlugin,
  and,
  type GuardResolution,
  or,
  redirect,
} from "./index";

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

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends <
  Value,
>() => Value extends Right ? 1 : 2
  ? true
  : false;
type Expect<Value extends true> = Value;

// TYPE-01 — Public names compose without casts, including nested composites.
const rawGuard = ({
  params,
}: {
  activityName: "ArticleEdit";
  params: { articleId: string };
}): true | GuardResolution =>
  params.articleId ? true : redirect("Article", params);
const fallbackGuard = ({
  params,
}: {
  activityName: "ArticleEdit";
  params: { articleId: string };
}): true | GuardResolution => redirect("Login", { returnTo: params.articleId });
const publicRawGuard: ActivityGuard = rawGuard;
const anyResolution: GuardResolution = redirect("Login", { returnTo: "a-1" });
const all = and({ guards: [rawGuard, fallbackGuard] });
const any = or({
  guards: [rawGuard, fallbackGuard],
  otherwise: ({ params }) => redirect("Article", params),
});
const nested = and({ guards: [any, rawGuard] });
const publicCompositeGuard: ActivityGuard = nested;
activityGuardPlugin({
  guards: {
    ArticleEdit: all,
    Article: ({ params }) => (params.articleId ? true : anyResolution),
  },
});
activityGuardPlugin({ guards: { ArticleEdit: nested } });

// TYPE-02 — Each guards-map key narrows both activityName and params.
activityGuardPlugin({
  guards: {
    ArticleEdit: ({ activityName, params }) => {
      const name: "ArticleEdit" = activityName;
      const articleId: string = params.articleId;
      // @ts-expect-error TYPE-02 — Login params are unavailable here.
      params.returnTo;
      // @ts-expect-error TYPE-02 — The key fixes the activity-name literal.
      const login: "Login" = activityName;
      void name;
      void articleId;
      void login;
      return true;
    },
    Login: ({ activityName, params }) => {
      const name: "Login" = activityName;
      const returnTo: string = params.returnTo;
      // @ts-expect-error TYPE-02 — ArticleEdit params are unavailable here.
      params.articleId;
      void name;
      void returnTo;
      return true;
    },
  },
});

// TYPE-03 — The map is partial, rejects unknown keys/arrays, and does not augment config.
activityGuardPlugin({ guards: { Home: () => true } });
activityGuardPlugin({
  guards: {
    // @ts-expect-error TYPE-03 — Only registered Activity names are valid keys.
    Unknown: () => true,
  },
});
activityGuardPlugin({
  guards: {
    // @ts-expect-error TYPE-03 — One key accepts one Guard, not an array.
    Home: [() => true],
  },
});
const activityDefinitionKeysStayUnchanged: Expect<
  Equal<keyof ActivityDefinition<RegisteredActivityName>, "name" | "loader">
> = true;

// TYPE-04 — Guards are synchronous and return only true or a resolution.
activityGuardPlugin({
  guards: {
    // @ts-expect-error TYPE-04 — false is not a Guard result.
    Home: () => false,
    // @ts-expect-error TYPE-04 — Promise results are not supported.
    Article: () => Promise.resolve(true),
    // @ts-expect-error TYPE-04 — async callbacks are not supported.
    Login: async () => true,
    ArticleEdit: ({ params }) =>
      params.articleId ? true : redirect("Home", {}),
  },
});

// TYPE-05 — Redirect names and params remain coupled.
redirect("Login", { returnTo: "a-1" });
redirect("Article", { articleId: "a-1" });
redirect("Home", {});
// @ts-expect-error TYPE-05 — The destination must be registered.
redirect("Unknown", {});
// @ts-expect-error TYPE-05 — Login does not accept Article params.
redirect("Login", { articleId: "a-1" });
// @ts-expect-error TYPE-05 — Article does not accept Login params.
redirect("Article", { returnTo: "a-1" });
// @ts-expect-error TYPE-05 — Required Article params cannot be omitted.
redirect("Article", {});

// TYPE-06 — Redirect expresses only an Activity target and its params.
// @ts-expect-error TYPE-06 — Paths are not Activity names.
redirect("/login", {});
// @ts-expect-error TYPE-06 — External URLs are not Activity names.
redirect("https://example.com", {});
// @ts-expect-error TYPE-06 — Navigation options are not accepted.
redirect("Login", { returnTo: "a-1" }, { animate: false });
// @ts-expect-error TYPE-06 — Replace is inherited from the source Entry.
redirect("Login", { returnTo: "a-1" }, { replace: true });

const articleGuard = (_input: {
  activityName: "Article";
  params: { articleId: string };
}): true => true;
// TYPE-07 — AND requires at least one Guard.
and({ guards: [articleGuard] });
and({ guards: [articleGuard, articleGuard] });
// @ts-expect-error TYPE-07 — Empty AND has no public meaning.
and({ guards: [] });

// TYPE-08 — OR requires guards and a resolution-only otherwise.
or({
  guards: [articleGuard],
  otherwise: ({ params }) => redirect("Login", { returnTo: params.articleId }),
});
// @ts-expect-error TYPE-08 — Empty OR has no public meaning.
or({ guards: [], otherwise: () => redirect("Home", {}) });
// @ts-expect-error TYPE-08 — otherwise is required.
or({ guards: [articleGuard] });
or({
  guards: [articleGuard],
  // @ts-expect-error TYPE-08 — otherwise must produce a resolution.
  otherwise: () => true,
});
or({
  guards: [articleGuard],
  // @ts-expect-error TYPE-08 — false is not a resolution.
  otherwise: () => false,
});

// TYPE-09 — otherwise receives the same Activity-specific input.
or({
  guards: [rawGuard],
  otherwise: ({ activityName, params }) => {
    const name: "ArticleEdit" = activityName;
    const articleId: string = params.articleId;
    // @ts-expect-error TYPE-09 — Login params are unavailable here.
    params.returnTo;
    return redirect("Login", { returnTo: name && articleId });
  },
});

void publicRawGuard;
void publicCompositeGuard;
void activityDefinitionKeysStayUnchanged;

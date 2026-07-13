import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { SnapshotEvent, StackflowPlugin } from "@stackflow/core";

type ActivityGuardInput<
  ActivityName extends RegisteredActivityName = RegisteredActivityName,
> = {
  activityName: ActivityName;
  params: InferActivityParams<ActivityName>;
};

const guardResolutionBrand: unique symbol = Symbol(
  "@stackflow/plugin-activity-guard/GuardResolution",
);

export type GuardResolution = {
  readonly [guardResolutionBrand]: true;
};

type ActivityGuardFor<ActivityName extends RegisteredActivityName> = (
  input: ActivityGuardInput<ActivityName>,
) => true | GuardResolution;

export type ActivityGuard = {
  [ActivityName in RegisteredActivityName]: ActivityGuardFor<ActivityName>;
}[RegisteredActivityName];

type NonEmptyArray<T> = readonly [T, ...T[]];

type Guards = Partial<{
  [ActivityName in RegisteredActivityName]: ActivityGuardFor<ActivityName>;
}>;

type GuardRedirect = GuardResolution & {
  activityName: RegisteredActivityName;
  params: InferActivityParams<RegisteredActivityName>;
};

type EntryTarget = {
  activityName: RegisteredActivityName;
  activityParams: InferActivityParams<RegisteredActivityName>;
};

type EntryTargetResolution = {
  target: EntryTarget;
  wasRedirected: boolean;
};

function resolveEntryTarget(
  guards: Guards,
  target: EntryTarget,
): EntryTargetResolution {
  let nextTarget = target;
  let wasRedirected = false;

  while (true) {
    const guard = guards[nextTarget.activityName] as
      | ActivityGuardFor<RegisteredActivityName>
      | undefined;

    if (!guard) {
      return { target: nextTarget, wasRedirected };
    }

    const resolution = guard({
      activityName: nextTarget.activityName,
      params: nextTarget.activityParams,
    });

    if (resolution === true) {
      return { target: nextTarget, wasRedirected };
    }

    const guardRedirect = resolution as GuardRedirect;
    wasRedirected = true;
    nextTarget = {
      activityName: guardRedirect.activityName,
      activityParams: guardRedirect.params,
    };
  }
}

function overrideInitialEntries(
  guards: Guards,
  initialEvents: SnapshotEvent[],
): SnapshotEvent[] {
  const nextEvents: SnapshotEvent[] = [];

  for (const event of initialEvents) {
    if (event.name !== "Pushed" && event.name !== "Replaced") {
      nextEvents.push(event);
      continue;
    }

    const resolution = resolveEntryTarget(guards, {
      activityName: event.activityName as RegisteredActivityName,
      activityParams: event.activityParams,
    });

    if (!resolution.wasRedirected) {
      nextEvents.push(event);
      continue;
    }

    nextEvents.push({
      ...event,
      ...resolution.target,
    });
    return nextEvents;
  }

  return initialEvents;
}

export function activityGuardPlugin(options: {
  guards: Guards;
}): StackflowPlugin {
  return () => ({
    key: "@stackflow/plugin-activity-guard",
    overrideInitialEvents({ initialEvents, initInfo }) {
      if (initInfo.kind === "load") {
        return initialEvents;
      }

      return overrideInitialEntries(options.guards, initialEvents);
    },
    onBeforePush({ actionParams, actions }) {
      const { target } = resolveEntryTarget(options.guards, {
        activityName: actionParams.activityName as RegisteredActivityName,
        activityParams: actionParams.activityParams,
      });

      actions.overrideActionParams({
        ...actionParams,
        ...target,
      });
    },
    onBeforeReplace({ actionParams, actions }) {
      const { target } = resolveEntryTarget(options.guards, {
        activityName: actionParams.activityName as RegisteredActivityName,
        activityParams: actionParams.activityParams,
      });

      actions.overrideActionParams({
        ...actionParams,
        ...target,
      });
    },
  });
}

export function redirect<ActivityName extends RegisteredActivityName>(
  activityName: ActivityName,
  params: InferActivityParams<ActivityName>,
): GuardResolution {
  return {
    [guardResolutionBrand]: true,
    activityName,
    params,
  } as GuardRedirect;
}

export function and<ActivityName extends RegisteredActivityName>(options: {
  guards: NonEmptyArray<ActivityGuardFor<ActivityName>>;
}): ActivityGuardFor<ActivityName> {
  return (input) => {
    for (const guard of options.guards) {
      const resolution = guard(input);

      if (resolution !== true) {
        return resolution;
      }
    }

    return true;
  };
}

export function or<ActivityName extends RegisteredActivityName>(options: {
  guards: NonEmptyArray<ActivityGuardFor<ActivityName>>;
  otherwise: (input: ActivityGuardInput<ActivityName>) => GuardResolution;
}): ActivityGuardFor<ActivityName> {
  return (input) => {
    for (const guard of options.guards) {
      if (guard(input) === true) {
        return true;
      }
    }

    return options.otherwise(input);
  };
}

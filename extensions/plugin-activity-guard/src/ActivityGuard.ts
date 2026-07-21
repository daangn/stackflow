import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { NonEmptyArray } from './NonEmptyArray'

export type GuardResolution = {
  type: "redirect",
  target: {
    [ActivityName in RegisteredActivityName]: {
      activityName: ActivityName,
      activityParams: InferActivityParams<ActivityName>
    }
  }[RegisteredActivityName]
} | true

export type ActivityGuardFor<ActivityName extends RegisteredActivityName> = (
  input: {
    activityName: ActivityName;
    activityParams: InferActivityParams<ActivityName>;
  },
) => GuardResolution;

export type ActivityGuard = {
  [ActivityName in RegisteredActivityName]: ActivityGuardFor<ActivityName>;
}[RegisteredActivityName];

export function redirect<ActivityName extends RegisteredActivityName>(
  activityName: ActivityName,
  activityParams: InferActivityParams<ActivityName>,
): GuardResolution {
  return {
    type: 'redirect',
    target: {
      activityName,
      activityParams
    }
  }
}

export function all<ActivityName extends RegisteredActivityName>(...guards: NonEmptyArray<ActivityGuardFor<ActivityName>>): ActivityGuardFor<ActivityName> {
  return (input) => {
    for (const guard of guards) {
      const resolution = guard(input);

      if (resolution !== true) {
        return resolution;
      }
    }

    return true;
  };
}

export type Target = {
  [ActivityName in RegisteredActivityName]: {
    activityName: ActivityName,
    activityParams: InferActivityParams<ActivityName>
  }
}[RegisteredActivityName]

export type Guards = Partial<{
  [ActivityName in RegisteredActivityName]: ActivityGuardFor<ActivityName>;
}>;

export function resolveGuards(origin: Target, guards: Guards): {
  target: Target,
  blocked: boolean
} {
  const guard = guards[origin.activityName];

  if (typeof guard !== "function") return {
    target: origin,
    blocked: false
  };

  const resolution = guard(origin);

  if (resolution === true) return {
    target: origin,
    blocked: false
  };

  return {
    target: resolveGuards(resolution.target, guards).target,
    blocked: true
  }
}

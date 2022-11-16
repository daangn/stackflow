import type { Activity, ActivityNestedRoute } from "./AggregateOutput";

export type Effect =
  | {
      _TAG: "%SOMETHING_CHANGED%";
    }
  | {
      _TAG: "PUSHED";
      activity: Activity;
    }
  | {
      _TAG: "REPLACED";
      activity: Activity;
    }
  | {
      _TAG: "POPPED";
      activity: Activity;
    }
  | {
      _TAG: "NESTED_PUSHED";
      activity: Activity;
      activityNestedRoute: ActivityNestedRoute;
    }
  | {
      _TAG: "NESTED_REPLACED";
      activity: Activity;
      activityNestedRoute: ActivityNestedRoute;
    }
  | {
      _TAG: "NESTED_POPPED";
      activity: Activity;
    };

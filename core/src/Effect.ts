import { Activity } from "./AggregateOutput";

export type Effect =
  | {
      _TAG: "%SOMETHING_CHANGED%";
    }
  | {
      _TAG: "PUSHED";
      activity: Activity;
    }
  | {
      _TAG: "POPPED";
      activity: Activity;
    }
  | {
      _TAG: "REPLACED";
      activity: Activity;
    };

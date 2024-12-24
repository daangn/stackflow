import type { Activity, ActivityStep } from "./Stack";

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
      _TAG: "STEP_PUSHED";
      activity: Activity;
      step: ActivityStep;
    }
  | {
      _TAG: "STEP_REPLACED";
      activity: Activity;
      step: ActivityStep;
    }
  | {
      _TAG: "STEP_POPPED";
      activity: Activity;
    }
  | {
      _TAG: "PAUSED";
    }
  | {
      _TAG: "RESUMED";
    };

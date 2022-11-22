import type { BaseDomainEvent } from "./_base";

export type ActivityRegisteredEvent = BaseDomainEvent<
  "ActivityRegistered",
  {
    activityName: string;
    activityParamsSchema?: {
      type: "object";
      properties: {
        [key: string]: {
          type: "string";
          enum?: string[];
        };
      };
      required: string[];
    };
  }
>;

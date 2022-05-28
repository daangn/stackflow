import { makeEvent } from "@stackflow/core";
import React from "react";

import { CoreProvider, useCore } from "./core";

interface MakeStackflowOptions {
  transitionDuration: number;
  activities: {
    [activityName: string]: React.FC;
  };
  initialActivity: () => string;
}
export function makeStackflow(options: MakeStackflowOptions) {
  const useFlow = () => {
    const core = useCore();

    return {
      push(activityName: string) {
        const activityId = `id${new Date().getTime().toString()}`;

        core.dispatchEvent("Pushed", {
          activityId,
          activityName,
        });
      },
      pop() {
        core.dispatchEvent("Popped", {});
      },
    };
  };

  const Test: React.FC = () => {
    const core = useCore();
    const { push, pop } = useFlow();

    return (
      <div style={{ whiteSpace: "pre" }}>
        <button
          type="button"
          onClick={() => {
            push("hello");
          }}
        >
          push
        </button>
        <button type="button" onClick={() => pop()}>
          pop
        </button>
        {JSON.stringify(core.aggregateOutput, null, 2)}
      </div>
    );
  };

  const initialEventDate = new Date().getTime() - 1000 * 60;

  const initialEvents = [
    makeEvent("Initialized", {
      transitionDuration: options.transitionDuration,
      eventDate: initialEventDate,
    }),
    ...Object.keys(options.activities).map((activityName) =>
      makeEvent("ActivityRegistered", {
        activityName,
        eventDate: initialEventDate,
      }),
    ),
    makeEvent("Pushed", {
      activityId: "initial",
      activityName: options.initialActivity(),
      eventDate: initialEventDate,
    }),
  ];

  const Stack: React.FC = () => (
    <CoreProvider initialEvents={initialEvents}>
      <Test />
    </CoreProvider>
  );

  return {
    Stack,
    useFlow,
  };
}

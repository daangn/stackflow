import { makeEvent } from "@stackflow/core";
import React, { useMemo } from "react";

import { CoreProvider, useCore } from "./core";

interface StackflowPlugin {
  id: string;
  render?: (args: {
    activities: Array<{
      id: string;
      render: () => React.ReactNode;
    }>;
  }) => React.ReactElement<any, any> | null;
}

interface MakeStackflowOptions {
  transitionDuration: number;
  activities: {
    [activityName: string]: React.FC;
  };
  initialActivity: () => string;
  plugins?: StackflowPlugin[];
}
export function makeStackflow(options: MakeStackflowOptions) {
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

  const useFlow = () => {
    const { dispatchEvent } = useCore();

    return useMemo(
      () => ({
        push(activityName: string) {
          const activityId = `id${new Date().getTime().toString()}`;

          dispatchEvent("Pushed", {
            activityId,
            activityName,
          });
        },
        pop() {
          dispatchEvent("Popped", {});
        },
      }),
      [dispatchEvent],
    );
  };

  interface RendererProps {
    plugin: StackflowPlugin;
  }
  const Renderer: React.FC<RendererProps> = ({ plugin: { render } }) => {
    const core = useCore();

    if (!render) {
      return null;
    }

    return render({
      activities: core.state.activities.map((activity) => ({
        id: activity.activityId,
        render() {
          const ActivityComponent = options.activities[activity.activityName];

          return (
            <div>
              {activity.activityId}
              <ActivityComponent />
            </div>
          );
        },
      })),
    });
  };

  const Stack: React.FC = () => (
    <CoreProvider initialEvents={initialEvents}>
      {options.plugins?.map((plugin) => (
        <Renderer key={plugin.id} plugin={plugin} />
      ))}
    </CoreProvider>
  );

  return {
    Stack,
    useFlow,
  };
}

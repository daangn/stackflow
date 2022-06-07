import { makeEvent } from "@stackflow/core";
import React, { useMemo } from "react";

import {
  ActivityComponentType,
  ActivityProvider,
  makeActivityId,
} from "./activity";
import { CoreProvider, useCore } from "./core";
import { StackflowPlugin } from "./StackflowPlugin";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type BaseActivities = {
  [activityName: string]: ActivityComponentType;
};

export interface StackProps<T extends BaseActivities> {
  initialActivity: Extract<keyof T, string>;
}

type StackflowOptions<T extends BaseActivities> = {
  activities: T;
  transitionDuration: number;
  plugins?: StackflowPlugin[];
};

export function stackflow<T extends BaseActivities>(
  options: StackflowOptions<T>,
) {
  const initialEventDate = new Date().getTime() - MINUTE;

  interface PluginRendererProps {
    plugin: WithRequired<StackflowPlugin, "render">;
  }
  const PluginRenderer: React.FC<PluginRendererProps> = ({ plugin }) => {
    const core = useCore();

    return plugin.render({
      activities: core.state.activities.map((activity) => ({
        key: activity.id,
        render() {
          const ActivityComponent = options.activities[activity.name];

          return (
            <ActivityProvider key={activity.id} activityId={activity.id}>
              <ActivityComponent />
            </ActivityProvider>
          );
        },
      })),
    });
  };

  const Stack: React.FC<StackProps<T>> = ({ initialActivity }) => {
    const initialEvents = useMemo(
      () => [
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
          activityId: makeActivityId(),
          activityName: initialActivity,
          eventDate: initialEventDate,
        }),
      ],
      [],
    );

    return (
      <CoreProvider initialEvents={initialEvents}>
        {(options.plugins ?? [])
          .filter(
            (plugin): plugin is WithRequired<typeof plugin, "render"> =>
              !!plugin.render,
          )
          .map((plugin) => (
            <PluginRenderer key={plugin.id} plugin={plugin} />
          ))}
      </CoreProvider>
    );
  };

  const useFlow = () => {
    const { dispatchEvent } = useCore();

    return useMemo(
      () => ({
        push(activityName: Extract<keyof T, string>) {
          dispatchEvent("Pushed", {
            activityId: makeActivityId(),
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

  return {
    Stack,
    useFlow,
  };
}

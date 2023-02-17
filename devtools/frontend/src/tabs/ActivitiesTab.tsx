import { Stack } from "@stackflow/core";
import { useRef } from "react";
import LogWindow from "../components/LogWindow";
import Splitter from "../components/Splitter";
import TreeView from "../components/TreeView";
import * as css from "./ActivitiesTab.css";
import ActivityComponent from "./activities/ActivityComponent";

const testData: Stack = {
  activities: [
    {
      id: "A",
      name: "sample",
      transitionState: "enter-done",
      params: {},
      steps: [
        {
          id: "A",
          params: {},
          enteredBy: {
            id: "987ac1916f82",
            eventDate: 1676529949813,
            activityId: "A",
            activityName: "sample",
            activityParams: {},
            name: "Pushed",
          },
        },
      ],
      enteredBy: {
        id: "987ac1916f82",
        eventDate: 1676529949813,
        activityId: "A",
        activityName: "sample",
        activityParams: {},
        name: "Pushed",
      },
      isTop: false,
      isActive: false,
      isRoot: true,
      zIndex: 0,
    },
    {
      id: "B",
      name: "sample",
      transitionState: "exit-done",
      params: {},
      steps: [
        {
          id: "B",
          params: {},
          enteredBy: {
            id: "987ac1916f83",
            eventDate: 1676529949814,
            activityId: "B",
            activityName: "sample",
            activityParams: {},
            name: "Pushed",
          },
        },
      ],
      enteredBy: {
        id: "987ac1916f83",
        eventDate: 1676529949814,
        activityId: "B",
        activityName: "sample",
        activityParams: {},
        name: "Pushed",
      },
      exitedBy: {
        id: "987ac1916f84",
        eventDate: 1676529949815,
        activityId: "C",
        activityName: "sample",
        activityParams: {},
        name: "Replaced",
      },
      isTop: false,
      isActive: false,
      isRoot: false,
      zIndex: -1,
    },
    {
      id: "C",
      name: "sample",
      transitionState: "exit-done",
      params: {},
      steps: [
        {
          id: "C",
          params: {},
          enteredBy: {
            id: "987ac1916f84",
            eventDate: 1676529949815,
            activityId: "C",
            activityName: "sample",
            activityParams: {},
            name: "Replaced",
          },
        },
      ],
      enteredBy: {
        id: "987ac1916f84",
        eventDate: 1676529949815,
        activityId: "C",
        activityName: "sample",
        activityParams: {},
        name: "Replaced",
      },
      exitedBy: {
        id: "987ac1916f85",
        eventDate: 1676530009660,
        activityId: "D",
        activityName: "sample",
        activityParams: {},
        name: "Replaced",
      },
      isTop: false,
      isActive: false,
      isRoot: false,
      zIndex: -1,
    },
    {
      id: "D",
      name: "sample",
      transitionState: "enter-done",
      params: {},
      steps: [
        {
          id: "D",
          params: {},
          enteredBy: {
            id: "987ac1916f85",
            eventDate: 1676530009660,
            activityId: "D",
            activityName: "sample",
            activityParams: {},
            name: "Replaced",
          },
        },
      ],
      enteredBy: {
        id: "987ac1916f85",
        eventDate: 1676530009660,
        activityId: "D",
        activityName: "sample",
        activityParams: {},
        name: "Replaced",
      },
      isTop: true,
      isActive: true,
      isRoot: false,
      zIndex: 1,
    },
  ],
  registeredActivities: [{ name: "sample" }],
  transitionDuration: 300,
  globalTransitionState: "idle",
};

export default function ActivitiesTab() {
  const stackWindowRef = useRef(null);
  const logWindowRef = useRef(null);

  const onActivityClick = (id: string) => {
    console.log("Activity clicked", id);
  };

  return (
    <div className={css.tab}>
      <div
        style={{
          flex: "1 1",
          overflow: "scroll",
          display: "flex",
          width: "100%",
        }}
      >
        <div
          style={{
            flex: "1 1",
            padding: "1rem",
            display: "flex",
            flexDirection: "column-reverse",
            overflow: "scroll",
            //alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {testData.activities
            .filter((activity) => activity.exitedBy)
            .map((activity) => (
              <ActivityComponent
                activity={activity}
                onClick={onActivityClick}
                key={activity.id}
              />
            ))}
          {testData.activities
            .filter((activity) => !activity.exitedBy)
            .map((activity) => (
              <ActivityComponent
                activity={activity}
                onClick={onActivityClick}
                key={activity.id}
              />
            ))}
        </div>
        <Splitter paneRef={stackWindowRef} mode="vertical" />
        <div
          ref={stackWindowRef}
          style={{
            flex: "0 0 50%",
            padding: "1rem",
            overflow: "scroll",
            boxSizing: "border-box",
          }}
        >
          <TreeView data={testData} name="Stack" />
        </div>
      </div>
      <Splitter paneRef={logWindowRef} mode="horizontal" />
      <LogWindow ref={logWindowRef} />
    </div>
  );
}

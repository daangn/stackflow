import { Stack } from "@stackflow/core";
import { createContext, useEffect, useRef, useState } from "react";
import LogWindow from "../components/LogWindow";
import Splitter from "../components/Splitter";
import TreeView from "../components/TreeView";
import * as css from "./ActivitiesTab.css";
import ActivityComponent from "./activities/ActivityComponent";
import getDiff from "../utils/diff";
import toggleFlag from "../utils/toggleFlag";

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

const lhs: Stack = {
  activities: [],
  globalTransitionState: "idle",
  registeredActivities: [],
  transitionDuration: 300,
};

const rhs: Stack = {
  activities: [],
  globalTransitionState: "loading",
  registeredActivities: [
    {
      name: "sample",
    },
  ],
  transitionDuration: 400,
};

export default function ActivitiesTab() {
  const treeWindowRef = useRef(null);
  const logWindowRef = useRef(null);

  const [data, setData] = useState<Stack>(testData);
  const prevData = useRef({});

  /**
   * Stack: {
   *   activities: {
   *     0: {
   *       $opened: true
   *     }
   *   },
   *   $opened: true
   * }
   */
  const [openTree, setOpenTree] = useState<any>({});

  // For highlighting, we need to use different classname containing transition with this flag
  const [updateFlag, setUpdateFlag] = useState(false);

  /**
   * Stack: {
   *   activities: {
   *     0: {
   *       $value: true
   *     },
   *     1: {
   *       $key : true
   *     }
   *   }
   * }
   */
  const [updateTree, setUpdateTree] = useState<any>({});

  // const toggle = () => {
  //   if (data.globalTransitionState === "idle") {
  //     setData(rhs);
  //   } else {
  //     setData(lhs);
  //   }
  // };

  useEffect(() => {
    const diff = getDiff(prevData.current, data);
    setUpdateFlag((updateFlag) => !updateFlag);
    setUpdateTree(diff);
    prevData.current = data;
  }, [data]);

  const onActivityClick = (id: string) => {
    setOpenTree({
      ...openTree,
      activities: {
        ...openTree?.activities,
        [data.activities.findIndex((a) => a.id === id).toString()]: {
          $opened: true,
        },
        $opened: true,
      },
      $opened: true,
    });
    console.log("Activity clicked", id);
  };

  const toggleOpen = (id: string) => {
    const keys = id.split(".");
    // slice(1) to remove virtual key "Stack"
    setOpenTree(toggleFlag(openTree, keys.slice(1), "$opened"));
  };

  return (
    <div className={css.tab}>
      {/* <button onClick={toggle}>ㅋㅋ루삥뽕</button> */}
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          overflow: "scroll",
        }}
      >
        <div
          style={{
            flex: "1 1",
            padding: "1rem",
            display: "flex",
            flexDirection: "column-reverse",
            overflow: "scroll",
            gap: "0.5rem",
          }}
        >
          {data.activities.length === 0 && (
            <div style={{ textAlign: "center", flex: "1 1" }}>
              No activities provided
            </div>
          )}
          {data.activities
            .slice()
            .sort((a, b) => {
              if (a.exitedBy && !b.exitedBy) {
                return -1;
              }
              if (!a.exitedBy && b.exitedBy) {
                return 1;
              }
              return 0;
            })
            .map((activity) => (
              <ActivityComponent
                id={data.activities
                  .findIndex((a) => a.id === activity.id)
                  .toString()}
                activity={activity}
                onClick={onActivityClick}
                key={activity.id}
              />
            ))}
        </div>
        <Splitter paneRef={treeWindowRef} mode="vertical" />
        <div
          ref={treeWindowRef}
          style={{
            flex: "0 0 50%",
            padding: "1rem",
            overflow: "scroll",
            boxSizing: "border-box",
            position: "relative",
            scrollBehavior: "smooth",
          }}
        >
          <TreeView
            id="Stack"
            data={data}
            name="Stack"
            updateTree={updateTree}
            updateFlag={updateFlag}
            toggleOpen={toggleOpen}
            openTree={openTree}
          />
        </div>
      </div>
      <Splitter paneRef={logWindowRef} mode="horizontal" />
      <LogWindow ref={logWindowRef} />
    </div>
  );
}

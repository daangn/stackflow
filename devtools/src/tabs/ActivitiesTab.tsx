import { useEffect, useRef, useState } from "react";
import LogWindow from "../components/LogWindow";
import Splitter from "../components/Splitter";
import TreeView from "../components/TreeView";
import * as css from "./ActivitiesTab.css";
import ActivityComponent from "./activities/ActivityComponent";
import getDiff from "../utils/diff";
import toggleFlag from "../utils/toggleFlag";
import DispatcherTab from "./Dispatcher";

import useStack from "../hooks/useStack";
import Settings from "../components/Settings";
import FloatingButton from "../components/FloatingButton";
import PhotoIcon from "../components/icons/PhotoIcon";
import { Stack } from "@stackflow/core";

export type StackViewOptions = { hideExitedActivities: boolean };
export type StackExplorerOptions = { trackNewActivity: boolean };
export type Options = StackViewOptions | StackExplorerOptions;

function copyTextToClipboard(text: string) {
  //Create a textbox field where we can insert text to.
  var copyFrom = document.createElement("textarea");

  //Set the text content to be the text you wished to copy.
  copyFrom.textContent = text;

  //Append the textbox field into the body as a child.
  //"execCommand()" only works when there exists selected text, and the text is inside
  //document.body (meaning the text is part of a valid rendered HTML element).
  document.body.appendChild(copyFrom);

  //Select all the text!
  copyFrom.select();

  //Execute command
  document.execCommand("copy");

  //(Optional) De-select the text using blur().
  copyFrom.blur();

  //Remove the textbox field from the document.body, so no other JavaScript nor
  //other elements can get access to this.
  document.body.removeChild(copyFrom);
}

export default function ActivitiesTab() {
  const treeWindowRef = useRef(null);
  const bottomPaneRef = useRef(null);
  const logWindowRef = useRef(null);

  const data = useStack();

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

  const [stackViewOptions, setStackViewOptions] = useState<StackViewOptions>({
    hideExitedActivities: false,
  });

  const [stackExplorerOptions, setStackExplorerOptions] =
    useState<StackExplorerOptions>({
      trackNewActivity: true,
    });

  const [snapshots, setSnapshots] = useState<Stack[]>([]);

  useEffect(() => {
    const diff = getDiff(prevData.current, data);
    setUpdateFlag((updateFlag) => !updateFlag);
    setUpdateTree(diff);
    prevData.current = data;

    if (stackExplorerOptions.trackNewActivity) {
      const newActivities = Object.entries(diff.activities || {}).filter(
        ([key, value]) => key !== "$key" && (value as any).$key,
      );

      const newActivityKey = +newActivities[0]?.[0];

      if (newActivityKey) {
        const newActivity = data.activities[newActivityKey];

        const id = newActivity.id;

        onActivityClick(id);
      }
    }
  }, [data]);

  const onActivityClick = (id: string) => {
    const index = data.activities.findIndex((a) => a.id === id);

    setOpenTree({
      ...openTree,
      activities: {
        ...openTree?.activities,
        [index]: {
          $opened: true,
        },
        $opened: true,
      },
      $opened: true,
    });

    setTimeout(() => {
      window.location.hash = `#`;
      window.location.hash = `#Stack.activities.${index}`;
    }, 222);

    console.log("Activity clicked", id);
  };

  const toggleOpen = (id: string) => {
    const keys = id.split(".");
    // slice(1) to remove virtual key "Stack"
    setOpenTree(toggleFlag(openTree, keys.slice(1), "$opened"));
  };

  return (
    <div className={css.tab}>
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          overflow: "scroll",
          backgroundColor: "#242424",
        }}
      >
        <div
          style={{
            flex: "1 1",
            display: "flex",
            position: "relative",
            overflow: "scroll",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "0",
            }}
          >
            <Settings
              options={stackViewOptions}
              onChangeOption={(option, value) => {
                setStackViewOptions({
                  ...stackViewOptions,
                  [option]: value,
                });
              }}
            />
          </div>
          <div
            style={{
              flex: "1 1",
              display: "flex",
              flexDirection: "column-reverse",
              gap: "0.5rem",
              overflow: "scroll",
              padding: "1rem",
            }}
          >
            {data.activities.length === 0 && (
              <div style={{ textAlign: "center", flex: "1 1" }}>
                No activities provided
              </div>
            )}
            {data.activities
              .filter(
                (activity) =>
                  !stackViewOptions.hideExitedActivities ||
                  activity.transitionState !== "exit-done",
              )
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
        </div>
        <Splitter paneRef={treeWindowRef} mode="vertical" />
        <div
          ref={treeWindowRef}
          style={{
            flex: "0 0 50%",
            overflow: "scroll",
            boxSizing: "border-box",
            position: "relative",
            scrollBehavior: "smooth",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "0",
              display: "flex",
            }}
          >
            <FloatingButton icon={<PhotoIcon />}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <button
                  onClick={() => {
                    console.log("Snapshot", data);
                    setSnapshots([...snapshots, data]);
                  }}
                >
                  Snapshot
                </button>
                {snapshots.map((snapshot, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>#{index + 1}</span>
                    <button
                      onClick={() => {
                        // copy to clipboard
                        copyTextToClipboard(JSON.stringify(snapshot, null, 2));
                      }}
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </FloatingButton>
            <Settings
              options={stackExplorerOptions}
              onChangeOption={(option, value) => {
                setStackExplorerOptions({
                  ...stackExplorerOptions,
                  [option]: value,
                });
              }}
            />
          </div>
          <div
            style={{
              padding: "1rem",
              overflow: "scroll",
              scrollBehavior: "smooth",
              flex: "1 1",
              paddingBottom: "40vh",
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
      </div>
      <Splitter paneRef={bottomPaneRef} mode="horizontal" />
      <div
        style={{
          flex: "0 0 40%",
          display: "flex",
          overflow: "scroll",
          backgroundColor: "#302F36",
          boxSizing: "border-box",
        }}
        ref={bottomPaneRef}
      >
        <div
          style={{
            flex: "1 1",
            overflow: "scroll",
          }}
        >
          <DispatcherTab />
        </div>
        <Splitter paneRef={logWindowRef} mode="vertical" />
        <div
          style={{
            flex: "0 0 50%",
            display: "flex",
            flexDirection: "column",
            overflow: "scroll",
          }}
          ref={logWindowRef}
        >
          <LogWindow />
        </div>
      </div>
    </div>
  );
}

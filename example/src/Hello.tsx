import {
  ActivityComponentType,
  useActivity,
  useActivityParams,
} from "@stackflow/react";
import React from "react";

import { useFlow } from "./stackflow";

export interface HelloParams {
  hello: string;
}

const Hello: ActivityComponentType<HelloParams> = () => {
  const { push, pop } = useFlow();
  const activity = useActivity();

  const { hello } = useActivityParams<HelloParams>();

  return (
    <div
      style={{
        backgroundColor: (() => {
          switch (activity.transitionState) {
            case "enter-active":
              return "yellow";
            case "enter-done":
              return "green";
            case "exit-active":
              return "orange";
            case "exit-done":
              return "red";
            default:
              return "white";
          }
        })(),
      }}
    >
      id: {activity.id}, state: {activity.transitionState}{" "}
      <button
        type="button"
        onClick={() => {
          push("Hello", {
            hello: "world",
          });
        }}
      >
        push
      </button>
      <button
        type="button"
        onClick={() => {
          pop();
        }}
      >
        pop
      </button>
    </div>
  );
};

export default Hello;

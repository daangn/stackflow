import { useActivity } from "@stackflow/react";
import React from "react";

import { useFlow } from "./stackflow";

const Hello: React.FC = () => {
  const { push, pop } = useFlow();
  const { state } = useActivity();

  return (
    <div
      style={{
        backgroundColor: (() => {
          switch (state.transitionState) {
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
      id: {state.id}, state: {state.transitionState}{" "}
      <button
        type="button"
        onClick={() => {
          push("Hello");
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

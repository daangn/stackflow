import { useActivity } from "@stackflow/react";
import { CupertinoAppScreen } from "@stackflow/seed-design";
import React from "react";

import { useFlow } from "./stackflow";

const Hello: React.FC = () => {
  const { push, pop } = useFlow();
  const { state } = useActivity();

  return (
    <div>
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

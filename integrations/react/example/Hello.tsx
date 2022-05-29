import React from "react";

import { useActivity } from "../src";
import { useFlow } from "./stackflow";

const Hello: React.FC = () => {
  const { push, pop } = useFlow();
  const { state } = useActivity();

  return (
    <div>
      Hello, World!
      {state.transitionState}
      <button type="button" onClick={() => push("Hello")}>
        go
      </button>
      <button type="button" onClick={() => pop()}>
        back
      </button>
    </div>
  );
};

export default Hello;

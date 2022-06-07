import React from "react";

import { useFlow } from "./stackflow";

const Hello: React.FC = () => {
  const { push } = useFlow();

  return (
    <div>
      Hello, World!
      <button type="button" onClick={() => push("Hello")}>
        go
      </button>
    </div>
  );
};

export default Hello;

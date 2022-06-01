import { useActivity } from "@stackflow/react";
import { CupertinoAppScreen } from "@stackflow/seed-design";
import React from "react";

import { useFlow } from "./stackflow";

const Hello: React.FC = () => {
  const { push, pop } = useFlow();
  const { state } = useActivity();
  console.log(state);

  return (
    <CupertinoAppScreen>
      <div>Hello, World!</div>
    </CupertinoAppScreen>
  );
};

export default Hello;

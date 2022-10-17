import { BottomSheet } from "@stackflow/basic-ui";
import React from "react";

import { useFlow } from "../stackflow";
import * as css from "./TestModal.css";

console.log(BottomSheet);

const TestModal: React.FC = () => {
  const { push } = useFlow();
  return (
    <BottomSheet>
      <div className={css.container}>
        Testing Modal UI with Stackflow
        <button
          type="button"
          onClick={() => {
            push("Main", {});
          }}
        >
          test
        </button>
      </div>
    </BottomSheet>
  );
};

export default TestModal;

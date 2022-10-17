import { Modal } from "@stackflow/basic-ui";
import React from "react";

import * as css from "./TestModal.css";

const TestModal: React.FC = () => (
  <Modal>
    <div className={css.container}>Testing Modal UI with Stackflow</div>
  </Modal>
);

export default TestModal;

import { ActivityParams } from "@stackflow/core";
import React from "react";

export type ActivityComponentType<T extends ActivityParams<T> = {}> =
  React.ComponentType<T>;

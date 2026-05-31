import React from "react";

export const useDeferredValue: typeof React.useDeferredValue =
  React.useDeferredValue ?? ((value) => value);

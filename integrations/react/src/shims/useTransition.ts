import React from "react";

export const useTransition: typeof React.useTransition =
  React.useTransition ?? (() => [false, (cb: () => void) => cb()]);

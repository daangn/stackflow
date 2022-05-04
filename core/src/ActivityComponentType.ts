import React from "react";

export type ActivityComponentType<T extends { [key: string]: string }> =
  React.ComponentType<{
    params: T;
    preloadRef: any;
  }>;

export type ParamsOf<T> = T extends React.ComponentType<{
  params: infer U;
  preloadRef: any;
}>
  ? U
  : T extends {
      component: React.ComponentType<{
        params: infer V;
        preloadRef: any;
      }>;
    }
  ? V
  : unknown;

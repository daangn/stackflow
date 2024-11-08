import type { Component } from "solid-js";

export type ActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  Component<{ params: T }>;
